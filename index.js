const stringConstraints = ['maxLength', 'maxLength', 'pattern'];
const numberConstraints = ['min', 'max'];

module.exports = {
  plugin: schema => {
    const inputFieldAstNodes = [];
    for (let key in schema._typeMap) {
      const node = schema._typeMap[key];

      if (node.astNode && node.astNode.kind === 'InputObjectTypeDefinition') {
        inputFieldAstNodes.push(node.astNode);
      }
    }

    // filter nodes with only constraint directive
    const nodes = inputFieldAstNodes.filter(node => {
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

    const result = nodes
      .map(node => {
        // build string of yup object for each field
        const fieldObjs = node.fields
          .map(field => {
            const constraints = field.directives
              .filter(directive => directive.name.value === 'constraint')
              .reduce((prev, current) => {
                return [...prev, ...(current ? current.arguments : [])];
              }, []);

            if (constraints.length < 1) {
              return '';
            }

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
                `directive of ${field.name.value} includes both string and number constraint`
              );
            }

            return `${field.name.value}: yup${
              hasStringContraint ? '.string()' : ''
            }${hasNumberContraint ? '.number()' : ''}${constraints
              .map(
                constraint =>
                  `.${getYupPropName(constraint.name.value)}(${
                    constraint.value.value
                  })`
              )
              .join('')}`;
          })
          .filter(str => str.length > 0);

        return `export const ${
          node.name.value
        }ValidationSchema = yup.object().shape({ ${fieldObjs.join(',\n')}})`;
      })
      .join('');

    return `import yup from 'yup';
    ${result}`;
  }
};

function getYupPropName(constraintName) {
  if (constraintName === 'minLength') {
    return 'min';
  }
  if (constraintName === 'maxLength') {
    return 'max';
  }

  return constraintName;
}
