import React from 'react'
import ReactDOM from 'react-dom/client'
import { Admin, Resource, ListGuesser, EditGuesser } from 'react-admin'
import { dataProvider } from './dataProvider'
import { authProvider } from './authProvider'
import { UserList, UserEdit } from './resources/users'
import { TransactionList, TransactionValidation } from './resources/transactions'
import { KYCDocumentList, KYCDocumentReview } from './resources/kycDocuments'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Admin
      dataProvider={dataProvider}
      authProvider={authProvider}
      title="Banking Admin"
    >
      <Resource name="users" list={UserList} edit={UserEdit} />
      <Resource
        name="transactions/pending"
        options={{ label: 'Pending Transactions' }}
        list={TransactionList}
        edit={TransactionValidation}
      />
      <Resource
        name="kyc/documents/pending"
        options={{ label: 'Pending KYC' }}
        list={KYCDocumentList}
        edit={KYCDocumentReview}
      />
      <Resource name="accounts" list={ListGuesser} />
    </Admin>
  </React.StrictMode>,
)
