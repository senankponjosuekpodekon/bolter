import { List, Datagrid, TextField, EmailField, SelectField, Edit, SimpleForm, TextInput, SelectInput } from 'react-admin'

const roleChoices = [
  { id: 'CLIENT', name: 'Client' },
  { id: 'ADMIN', name: 'Admin' },
  { id: 'COMPLIANCE', name: 'Compliance' },
]

const statusChoices = [
  { id: 'ACTIVE', name: 'Active' },
  { id: 'SUSPENDED', name: 'Suspended' },
  { id: 'PENDING_VERIFICATION', name: 'Pending Verification' },
  { id: 'CLOSED', name: 'Closed' },
]

export const UserList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="id" />
      <EmailField source="email" />
      <TextField source="firstName" />
      <TextField source="lastName" />
      <SelectField source="role" choices={roleChoices} />
      <SelectField source="status" choices={statusChoices} />
      <TextField source="kycStatus" />
    </Datagrid>
  </List>
)

export const UserEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="email" />
      <TextInput source="firstName" />
      <TextInput source="lastName" />
      <SelectInput source="role" choices={roleChoices} />
      <SelectInput source="status" choices={statusChoices} />
    </SimpleForm>
  </Edit>
)
