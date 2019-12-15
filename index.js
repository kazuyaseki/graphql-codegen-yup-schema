const stringConstraints = ['maxLength', 'maxLength', 'pattern'];
const numberConstraints = ['min', 'max'];

module.exports = {
  plugin: schema => {
    const inputFields = getNodesWithConstraintDirective(schema);

    const result = inputFields
      .map(node => {
        // build string of yup object for each field
        const fieldYupObjectStrings = node.fields
          .map(buildYupObjectStringByField)
          .filter(str => str.length > 0);

        return `export const ${
          node.name.value
        }ValidationSchema = yup.object().shape({ ${fieldYupObjectStrings.join(
          ',\n'
        )}})`;
      })
      .join('\n\n');

    return `import * as yup from 'yup'
    ${result}`;
  }
};

function getNodesWithConstraintDirective(schema) {
  // filter only input object
  const inputFieldAstNodes = [];
  for (let key in schema._typeMap) {
    const node = schema._typeMap[key];

    if (node.astNode && node.astNode.kind === 'InputObjectTypeDefinition') {
      inputFieldAstNodes.push(node.astNode);
    }
  }

  // filter input objects with constraint directive
  return inputFieldAstNodes.filter(node => {
    let hasConstraint = false;

    node.fields.forEach(field => {
      field.directives.forEach(directive => {
        if (directive.name.value === 'constraint') {
          hasConstraint = true;
        }
      });
    });

    return hasConstraint;
  });
}

function getPropertyTypeString(constraints, fieldName) {
  const hasStringContraint =
    constraints.filter(constraint =>
      stringConstraints.includes(constraint.name.value)
    ).length > 0;
  const hasNumberContraint =
    constraints.filter(constraint =>
      numberConstraints.includes(constraint.name.value)
    ).length > 0;

  if (hasStringContraint && hasNumberContraint) {
    throw Error(
      `directive of ${fieldName} includes both string and number constraint`
    );
  }

  if (hasStringContraint) {
    return '.string()';
  }
  if (hasNumberContraint) {
    return '.number()';
  }

  throw Error(
    `directive of ${fieldName} includes both string and number constraint`
  );
}

function buildYupObjectStringByField(field) {
  const constraints = field.directives
    .filter(directive => directive.name.value === 'constraint')
    .reduce((prev, current) => {
      return [...prev, ...(current ? current.arguments : [])];
    }, []);

  if (constraints.length < 1) {
    return '';
  }

  const fieldName = field.name.value;

  const propTypeString = getPropertyTypeString(constraints, fieldName);

  return `${fieldName}: yup${propTypeString}${constraints
    .map(
      constraint =>
        `.${getYupPropName(constraint.name.value)}(${constraint.value.value})`
    )
    .join('')}`;
}

function getYupPropName(constraintName) {
  if (constraintName === 'minLength') {
    return 'min';
  }
  if (constraintName === 'maxLength') {
    return 'max';
  }

  return constraintName;
}
