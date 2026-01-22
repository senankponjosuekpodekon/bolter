# Test Complet: Changement de Langue dans Profile

## 📋 Plan de Test

### Test 1: Changement EN → FR dans Profile

**Objectif:** Vérifier que les traductions se mettent à jour immédiatement

**Étapes:**

1. Ouvrir http://localhost:5173/profile
2. Naviguer à "Interface personalization" (dernière section)
3. Trouver le dropdown "Language"
4. **Vérifier l'état initial:** Doit afficher "English (US)"
5. Cliquer sur le dropdown et sélectionner "Français (FR)"

**Vérifications à faire:**

- [ ] Dropdown change à "Français (FR)"
- [ ] Titre "Profile" devient "Profil"
- [ ] "Personal Information" devient "Informations personnelles"
- [ ] "Email" reste "Email"
- [ ] "First name" devient "Prénom"
- [ ] "Last name" devient "Nom"
- [ ] "Phone" devient "Téléphone"
- [ ] "Address" devient "Adresse"
- [ ] "Interface personalization" devient "Personnalisation de l'interface"
- [ ] Section "Widget" se traduit en français

**Résultat attendu:** ✅ Tous les textes changent immédiatement (sans rechargement)

---

### Test 2: localStorage Persistence

**Objectif:** Vérifier que la langue sélectionnée persiste au rechargement

**Étapes:**

1. **Après Test 1:** Vous êtes en français (FR)
2. Appuyer sur F5 pour recharger la page
3. Vérifier les traductions après rechargement

**Vérifications à faire:**

- [ ] Page se recharge
- [ ] Interface reste en français
- [ ] Dropdown affiche "Français (FR)"

**Résultat attendu:** ✅ La langue persiste au rechargement

---

### Test 3: localStorage Check

**Objectif:** Vérifier que la clé localStorage a la bonne valeur

**Étapes:**

1. Ouvrir Developer Tools (F12)
2. Aller dans "Application" → "Storage" → "Local Storage"
3. Chercher la clé `i18nextLng`

**Vérifications à faire (après changement en FR):**

- [ ] Clé `i18nextLng` existe
- [ ] Valeur = `fr-FR` (pas juste `fr`)

**Résultat attendu:** ✅ `i18nextLng: "fr-FR"`

---

### Test 4: Revenir à EN

**Objectif:** Vérifier que le changement EN ← FR fonctionne aussi

**Étapes:**

1. Ouvrir le dropdown Language (qui affiche "Français (FR)")
2. Sélectionner "English (US)"
3. Vérifier les traductions changent

**Vérifications à faire:**

- [ ] "Profil" redevient "Profile"
- [ ] "Informations personnelles" redevient "Personal Information"
- [ ] Dropdown affiche "English (US)"

**Résultat attendu:** ✅ Revenir à l'anglais fonctionne immédiatement

---

### Test 5: Cross-page Consistency

**Objectif:** Vérifier que la langue change partout, pas juste dans Profile

**Étapes (après avoir sélectionné FR dans Profile):**

1. Naviguer vers http://localhost:5173/dashboard
2. Vérifier les textes du Dashboard
3. Naviguer vers http://localhost:5173/transactions
4. Vérifier les textes des Transactions
5. Revenir à http://localhost:5173/profile

**Vérifications à faire:**

- [ ] Dashboard affiche des textes en français
- [ ] Transactions affichent des textes en français
- [ ] Profile revenir affiche toujours du français
- [ ] Dropdown Language affiche "Français (FR)"

**Résultat attendu:** ✅ La langue est cohérente partout

---

## 🔍 Diagnostic en Cas de Problème

### Problème: Textes ne changent pas quand je sélectionne une langue

**Vérifications:**

1. Ouvrir console (F12 → Console)
2. Taper: `console.log(localStorage.getItem('i18nextLng'))`
3. Voir la valeur retournée

**Si la valeur change:**

- ✅ localStorage fonctionne
- ⚠️ Problème dans le rendu React

**Actions:**

- Recharger la page (F5)
- Si ça marche après rechargement → localStorage OK, mais React re-render problème
- Si ça ne marche pas → problème plus profond

---

### Problème: localStorage a la mauvaise valeur

**Si localStorage dit `"fr"` au lieu de `"fr-FR"`:**

- ❌ useLocalization.ts n'a pas été corrigé correctement
- Action: Vérifier que le fix a été appliqué

**Si localStorage dit `"fr-FR"` mais traductions sont en EN:**

- ⚠️ Ressources i18next pas chargées correctement
- Action: Vérifier que loadLocale() a bien fonctionné

---

## ✅ Critères de Succès

| Critère                     | État       |
| --------------------------- | ---------- |
| Changement EN → FR immédiat | À vérifier |
| Changement FR → EN immédiat | À vérifier |
| localStorage = `"fr-FR"`    | À vérifier |
| Persistance au F5           | À vérifier |
| Cohérence multi-pages       | À vérifier |

---

## 📝 Résultats du Test

**Date:** ****\_\_\_****  
**Testeur:** ****\_\_\_****

### Résumé

- Test 1 EN → FR: [ ] PASS [ ] FAIL
- Test 2 localStorage: [ ] PASS [ ] FAIL
- Test 3 localStorage value: [ ] PASS [ ] FAIL
- Test 4 FR → EN: [ ] PASS [ ] FAIL
- Test 5 cross-page: [ ] PASS [ ] FAIL

**Verdict Global:** [ ] ✅ PASS [ ] ⚠️ NEEDS FIX [ ] ❌ FAIL

**Notes:**
