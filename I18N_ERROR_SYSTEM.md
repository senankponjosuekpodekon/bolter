# Système de Gestion d'Erreurs i18n

## 📋 Vue d'Ensemble

Système complet de détection, tracking et reporting des erreurs du système de traduction (i18n).

**Composants:**

- ✅ `i18nErrorHandler.ts` - Gestionnaire d'erreurs
- ✅ `i18nMonitor.ts` - Moniteur en temps réel
- ✅ `I18nDebugPanel.tsx` - Interface de debugging
- ✅ Intégration dans `i18n.ts`
- ✅ Intégration dans `App.tsx`

---

## 🔧 Fonctionnalités

### 1. Détection Automatique d'Erreurs

**Types d'erreurs détectées:**

```typescript
enum I18nErrorType {
  MISSING_KEY, // Clé de traduction manquante
  MISSING_NAMESPACE, // Namespace manquant
  LOCALE_LOAD_FAILED, // Échec de chargement de locale
  LOCALE_MISMATCH, // Mismatch entre locale attendue et actuelle
  INVALID_LOCALE, // Locale invalide/non supportée
  TRANSLATION_FAILED, // Erreur de traduction
}
```

### 2. Tracking en Temps Réel

**Fonctionnalités de tracking:**

- 📊 Comptage des erreurs par type
- ⏰ Historique des erreurs avec timestamps
- 🎯 Filtrage par période (dernières N minutes)
- 💾 Export JSON des erreurs
- 📄 Génération de rapports texte

### 3. Monitoring du Système

**Health checks automatiques:**

- ✅ Vérification de cohérence localStorage ↔ i18n.language
- ✅ Validation des namespaces chargés
- ✅ Détection de locales invalides
- ✅ Audit complet du système

### 4. Interface de Debugging

**Debug Panel (développement uniquement):**

- 🌐 Bouton flottant en bas à droite
- 📊 Affichage du status en temps réel
- 🔴 Badge avec nombre d'erreurs
- 📈 Statistiques d'erreurs
- 📥 Export de rapports
- 🧹 Nettoyage des erreurs

---

## 🚀 Utilisation

### En Développement

Le debug panel apparaît automatiquement en mode DEV:

```bash
npm run dev
```

**Accès au panel:**

1. Ouvrir http://localhost:5173
2. Cliquer sur le bouton 🌐 en bas à droite
3. Voir le status et les erreurs en temps réel

**Console JavaScript:**

```javascript
// Accès direct au gestionnaire d'erreurs
window.i18nErrorManager.getErrors();
window.i18nErrorManager.getErrorCounts();
window.i18nErrorManager.generateReport();

// Accès au moniteur
window.i18nMonitor.audit(window.i18n);
window.i18nMonitor.healthCheck(window.i18n);
window.i18nMonitor.generateReport(window.i18n);
```

### Utilisation Programmatique

**Logger une erreur manuellement:**

```typescript
import { i18nErrorManager, I18nErrorType } from "./utils/i18nErrorHandler";

i18nErrorManager.logError(I18nErrorType.MISSING_KEY, "Custom error message", {
  key: "profile.title",
  namespace: "common",
  locale: "fr-FR",
});
```

**S'abonner aux erreurs:**

```typescript
const unsubscribe = i18nErrorManager.onError((error) => {
  console.log("New i18n error:", error);
  // Envoyer à un service de tracking, etc.
});

// Plus tard
unsubscribe();
```

**Effectuer un audit:**

```typescript
import { i18nMonitor } from "./utils/i18nMonitor";
import i18n from "./i18n";

const audit = i18nMonitor.audit(i18n);

if (audit.status === "ERROR") {
  console.error("i18n system has errors:", audit.issues);
}
```

---

## 📊 Debug Panel - Guide Utilisateur

### Ouverture du Panel

Cliquer sur le bouton flottant 🌐 en bas à droite de l'écran.

**Badge de notification:**

- Affiche le nombre total d'erreurs
- Apparaît uniquement s'il y a des erreurs

### Sections du Panel

#### 1. Status

```
Locale: fr-FR              (langue actuelle)
localStorage: fr-FR         (langue stockée)
Health: OK | ERROR          (statut général)
```

#### 2. Error Counts

Comptage des erreurs par type:

```
MISSING_KEY: 5
LOCALE_LOAD_FAILED: 2
...
```

#### 3. Recent Errors

Erreurs des 5 dernières minutes avec détails:

- Type d'erreur
- Message
- Clé affectée (si applicable)
- Timestamp

#### 4. Audit Result

Résultat de l'audit manuel:

- Status (OK / WARNING / ERROR)
- Issues trouvés
- Namespaces chargés

### Actions Disponibles

| Bouton               | Action                                                  |
| -------------------- | ------------------------------------------------------- |
| **Run Audit**        | Lance un audit complet du système                       |
| **Download Report**  | Télécharge un rapport texte complet                     |
| **Export JSON**      | Exporte les erreurs en JSON                             |
| **Clear All Errors** | Efface toutes les erreurs (ne résout pas les problèmes) |

---

## 🔍 Scénarios de Debugging

### Scénario 1: Traductions ne Changent Pas

**Symptôme:** User sélectionne FR mais l'UI reste en EN

**Actions de debugging:**

1. Ouvrir le Debug Panel
2. Cliquer sur "Run Audit"
3. Vérifier:
   - Status = OK ou ERROR?
   - localStorage = locale actuelle?
   - Namespaces chargés?
   - Erreurs LOCALE_MISMATCH?

**Exemple de résultat:**

```
Status: ERROR
Issues:
  - localStorage locale (fr) differs from current locale (fr-FR)
  - Missing namespace: common for locale fr-FR
```

**Solution:** Fixer le mismatch de locale code

### Scénario 2: Clés de Traduction Manquantes

**Symptôme:** Certains textes affichent des clés au lieu de traductions

**Actions de debugging:**

1. Ouvrir le Debug Panel
2. Regarder "Error Counts"
3. Vérifier MISSING_KEY count
4. Regarder "Recent Errors" pour voir quelles clés manquent

**Exemple:**

```
MISSING_KEY: 12

Recent Errors:
  [MISSING_KEY] Missing translation key: profile.new_feature
  Key: profile.new_feature
  Namespace: common
  Locale: fr-FR
```

**Solution:** Ajouter la clé manquante dans `/locales/fr/common.json`

### Scénario 3: Namespace Pas Chargé

**Symptôme:** Erreurs console "namespace not loaded"

**Actions de debugging:**

1. Run Audit
2. Vérifier "Loaded Namespaces"
3. Comparer avec namespaces requis

**Exemple:**

```
Loaded Namespaces: common, errors
Missing Namespaces: kyc, transactions, admin, notifications
```

**Solution:** Vérifier que loadLocale() charge bien tous les namespaces

---

## 📈 Rapports et Exports

### Rapport Texte (Download Report)

Contient:

- Status général
- Locale actuelle vs localStorage
- Namespaces chargés et manquants
- Liste complète des erreurs récentes
- Statistiques d'erreurs

**Format:**

```
=== i18n Monitoring Report ===

Status: OK
Current Locale: fr-FR
localStorage Locale: fr-FR
Locale Consistent: Yes

Loaded Namespaces (6):
  ✅ common
  ✅ errors
  ...

=== i18n Error Report ===

Total Errors: 3
Recent Errors (last 5 min): 1

Error Counts by Type:
  - MISSING_KEY: 3

Recent Errors:
1. [MISSING_KEY] Missing translation key: test
   Key: test
   Namespace: common
   Locale: fr-FR
   Time: 14:30:45
```

### Export JSON (Export JSON)

Contient la liste complète des erreurs au format JSON:

```json
[
  {
    "type": "MISSING_KEY",
    "message": "Missing translation key: test",
    "key": "test",
    "namespace": "common",
    "locale": "fr-FR",
    "timestamp": "2025-12-10T14:30:45.123Z"
  }
]
```

**Utilisation:**

- Import dans outils d'analyse
- Tracking historique
- CI/CD validation

---

## 🛠️ Configuration

### Activer/Désactiver le Monitoring

**Par défaut:** Activé en développement

**Désactiver:**

```typescript
import { i18nMonitor } from "./utils/i18nMonitor";

i18nMonitor.configure({
  checkMissingKeys: false,
  checkNamespaces: false,
  checkLocaleConsistency: false,
  logToConsole: false,
});
```

### Changer la Limite d'Erreurs

**Par défaut:** 100 erreurs max

**Modifier dans `i18nErrorHandler.ts`:**

```typescript
private maxErrors = 200; // Nouvelle limite
```

---

## 🧪 Tests Recommandés

### Test 1: Changement de Langue

```
1. Ouvrir Debug Panel
2. Aller sur Profile
3. Changer langue EN → FR
4. Vérifier dans Debug Panel:
   - Status = OK
   - Locale = fr-FR
   - localStorage = fr-FR
   - Error Counts = 0
```

### Test 2: Clé Manquante

```
1. Ajouter dans code: t('fake.key.that.does.not.exist')
2. Ouvrir Debug Panel
3. Vérifier:
   - MISSING_KEY count augmente
   - Recent Errors affiche l'erreur
   - Key = 'fake.key.that.does.not.exist'
```

### Test 3: localStorage Mismatch

```
1. Dans console: localStorage.setItem('i18nextLng', 'fr')
2. Recharger page
3. Ouvrir Debug Panel
4. Run Audit
5. Vérifier:
   - Status = WARNING ou ERROR
   - Issue: "locale mismatch"
```

---

## 🚨 Alertes Importantes

### En Production

Le Debug Panel **n'apparaît PAS** en production:

```typescript
if (!import.meta.env.DEV) {
  return null; // Panel invisible
}
```

Le tracking d'erreurs **continue de fonctionner** mais:

- Pas de console.error (sauf si configuré)
- Pas d'accès window.i18nErrorManager
- Possibilité d'envoyer erreurs à un service externe

### Performance

**Impact minimal:**

- Event listeners i18n natifs
- Limite de 100 erreurs max (mémoire contrôlée)
- Pas de polling, uniquement event-driven

---

## 📚 API Reference

### i18nErrorManager

```typescript
class I18nErrorManager {
  // Logger une erreur
  logError(type: I18nErrorType, message: string, details?: {...}): void

  // Récupérer les erreurs
  getErrors(): I18nError[]
  getErrorsByType(type: I18nErrorType): I18nError[]
  getRecentErrors(minutesAgo: number): I18nError[]
  getErrorCounts(): Record<I18nErrorType, number>

  // S'abonner aux erreurs
  onError(callback: (error: I18nError) => void): () => void

  // Utilitaires
  clearErrors(): void
  generateReport(): string
  exportErrors(): string

  // Helpers spécifiques
  checkMissingKey(key: string, namespace: string, locale: string): void
  checkMissingNamespace(namespace: string, locale: string): void
  checkLocaleLoadFailed(locale: string, error: Error): void
  checkLocaleMismatch(expected: string, actual: string): void
}
```

### i18nMonitor

```typescript
class I18nMonitor {
  // Configuration
  configure(config: Partial<I18nMonitorConfig>): void

  // Initialisation
  init(i18nInstance: i18n): void

  // Audit et santé
  audit(i18nInstance: i18n): {...}
  healthCheck(i18nInstance: i18n): boolean

  // Rapports
  generateReport(i18nInstance: i18n): string
}
```

---

## ✅ Checklist d'Implémentation

- [x] Créer `i18nErrorHandler.ts`
- [x] Créer `i18nMonitor.ts`
- [x] Intégrer dans `i18n.ts`
- [x] Créer `I18nDebugPanel.tsx`
- [x] Intégrer dans `App.tsx`
- [x] Tester en développement
- [ ] Tester changement de langue avec monitoring
- [ ] Tester détection de clés manquantes
- [ ] Tester export de rapports
- [ ] Documenter pour l'équipe

---

## 🎯 Prochaines Étapes

1. **Test du système complet** en développement
2. **Validation** que le monitoring détecte bien les erreurs
3. **Configuration** d'envoi d'erreurs à un service externe (optionnel)
4. **Documentation** pour l'équipe de développement
5. **CI/CD** : Ajouter validation i18n dans pipeline

---

**Date de création:** 10 décembre 2025  
**Status:** ✅ Implémenté et prêt pour test
