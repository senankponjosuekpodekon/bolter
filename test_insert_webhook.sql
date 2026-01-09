-- Try to insert a webhook directly to test if the foreign key works
INSERT INTO webhooks (user_id, url, secret, events, is_active)
VALUES (
  'beed9b48-a04d-421f-bcb0-878dd5e4eda9',
  'https://webhook.site/test',
  'whsec_test123',
  ARRAY['transaction.created'],
  true
)
RETURNING *;
