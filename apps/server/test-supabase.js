// apps/server/test-supabase.js
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement depuis le fichier .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- Test de connectivité Supabase ---');
console.log('URL:', supabaseUrl ? 'Trouvée' : 'NON TROUVÉE');
console.log('Service Key:', supabaseServiceKey ? 'Trouvée' : 'NON TROUVÉE');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\nErreur: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY est manquant dans votre fichier .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    console.log('\nTentative de connexion...');
    // On essaie de récupérer un seul utilisateur pour tester la clé.
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      throw error;
    }

    console.log('✅ Connexion à Supabase réussie !');
    console.log('Donnée test récupérée:', data);
  } catch (error) {
    console.error('\n❌ Échec de la connexion à Supabase.');
    console.error('Erreur reçue:', error.message);
    if (error.message.includes('Invalid API key')) {
        console.error('\n👉 Piste: La clé SUPABASE_SERVICE_ROLE_KEY est incorrecte. Veuillez la vérifier dans votre dashboard Supabase > Project Settings > API.');
    }
  }
}

testConnection();
