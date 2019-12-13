# graphql-codegen-yup-schema

graphql-codegen plugin to generate yup validation schema based on GraphQL schema directives

## Install

install using `yarn`:

    $ yarn add -D graphql-codegen-yup-schema

## Prerequisite

You need to specify the following directive definition in your GraphQL schema.

```graphql
directive @constraint(
  minLength: Int
  maxLength: Int
  pattern: String
  min: Int
  max: Int
) on INPUT_FIELD_DEFINITION | ARGUMENT_DEFINITION
```

## What it does for you

let's say you have a following mutation with `constraint` directive.

```graphql
input RegisterAddressInput {
  postalCode: String @constraint(minLength: 7, maxLength: 7)
  state: String @constraint(maxLength: 4)
  city: String @constraint(maxLength: 32)
  line1: String @constraint(maxLength: 32)
  line2: String @constraint(maxLength: 32)
}
```

then use this plugin with graphql-codegen with the config like below

```yml
schema: ./graphql/generated/schema.graphql
documents:
  - ./graphql/mutations/*.gql
generates:
  ./graphql/generated/validationSchemas.ts:
    - graphql-codegen-yup-schema
```

it will generate a yup validation object💪

```ts
import * as yup from 'yup';
export const RegisterAddressInputValidationSchema = yup.object().shape({
  postalCode: yup
    .string()
    .min(7)
    .max(7),
  state: yup.string().max(4),
  city: yup.string().max(32),
  line1: yup.string().max(32),
  line2: yup.string().max(32)
});
```

### Supported constraints

| name      | type   | description            |
| --------- | ------ | ---------------------- |
| minLength | int    | min length of a string |
| maxLength | int    | max length of a string |
| pattern   | string | regex for a string     |
| min       | int    | min value of a number  |
| max       | int    | max value of a number  |
