import { List, Datagrid, TextField, NumberField, DateField, Edit, SimpleForm, BooleanInput, TextInput, useRecordContext, useNotify, useRedirect, Button } from 'react-admin'
import { useState } from 'react'

export const TransactionList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="id" />
      <TextField source="from_account_id" label="From Account" />
      <TextField source="to_account_id" label="To Account" />
      <NumberField source="amount" />
      <TextField source="currency" />
      <TextField source="description" />
      <TextField source="status" />
      <DateField source="created_at" showTime />
    </Datagrid>
  </List>
)

export const TransactionValidation = () => {
  const record = useRecordContext()
  const notify = useNotify()
  const redirect = useRedirect()
  const [approved, setApproved] = useState(true)
  const [rejectionReason, setRejectionReason] = useState('')

  const handleValidate = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/transactions/${record.id}/validate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ approved, rejectionReason })
      })

      if (response.ok) {
        notify(approved ? 'Transaction approved' : 'Transaction rejected', { type: 'success' })
        redirect('/transactions/pending')
      } else {
        notify('Error validating transaction', { type: 'error' })
      }
    } catch (error) {
      notify('Error validating transaction', { type: 'error' })
    }
  }

  return (
    <Edit>
      <SimpleForm toolbar={false}>
        <TextField source="id" />
        <TextField source="from_account_id" />
        <TextField source="to_account_id" />
        <NumberField source="amount" />
        <TextField source="currency" />
        <TextField source="description" />
        <TextField source="iban_external" />
        <DateField source="created_at" showTime />

        <div style={{ marginTop: 20 }}>
          <h3>Validation</h3>
          <label>
            <input
              type="radio"
              checked={approved}
              onChange={() => setApproved(true)}
            />
            Approve
          </label>
          <label style={{ marginLeft: 20 }}>
            <input
              type="radio"
              checked={!approved}
              onChange={() => setApproved(false)}
            />
            Reject
          </label>

          {!approved ? (
            <div style={{ marginTop: 10 }}>
              <label>Rejection Reason:</label>
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                style={{ width: '100%', padding: 8, marginTop: 5 }}
              />
            </div>
          ) : false}

          <Button
            label={approved ? 'Approve Transaction' : 'Reject Transaction'}
            onClick={handleValidate}
            style={{ marginTop: 20 }}
          />
        </div>
      </SimpleForm>
    </Edit>
  )
}
