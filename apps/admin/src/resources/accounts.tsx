import { List, Datagrid, TextField, NumberField, DateField, Edit, SimpleForm, TextInput, required } from 'react-admin'

export const AccountList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="id" />
      <TextField source="user_id" label="User ID" />
      <TextField source="account_number" label="IBAN" />
      <TextField source="account_type" label="Type" />
      <NumberField source="balance" options={{ style: 'currency', currency: 'EUR' }} />
      <TextField source="status" />
      <DateField source="created_at" showTime />
    </Datagrid>
  </List>
)

export const AccountEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="user_id" label="User ID" disabled />
      <TextInput
        source="account_number"
        label="IBAN"
        validate={[
          required(),
          (value: string) => {
            if (!/^FR[0-9]{2}[0-9]{10}[A-Z0-9]{11}[0-9]{2}$/.test(value)) {
              return 'Invalid French IBAN format (e.g. FR7612345678901234567890123)'
            }
            return undefined
          }
        ]}
        helperText="French IBAN format: FR76 followed by 25 characters"
      />
      <TextInput source="account_type" label="Type" disabled />
      <NumberField source="balance" options={{ style: 'currency', currency: 'EUR' }} />
      <TextInput source="status" disabled />
      <DateField source="created_at" showTime />
    </SimpleForm>
  </Edit>
)
