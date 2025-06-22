# Sécurité de l'Application

## Mesures de Sécurité Implémentées

### 🔐 Authentification et Sessions
- **Hachage des mots de passe** : bcrypt avec salt automatique
- **Sessions sécurisées** : Stockage en base PostgreSQL avec rotation automatique
- **Cookies sécurisés** : httpOnly, sameSite=strict, durée limitée (24h)
- **Secret de session** : Clé 256-bit générée cryptographiquement

### 🛡️ Protection contre les Attaques
- **Rate Limiting** : 100 req/15min (API), 5 tentatives/15min (auth)
- **Validation d'entrée** : express-validator + Zod schema validation
- **Protection CSRF** : sameSite cookies + validation des origines
- **Injection SQL** : Protection via Drizzle ORM avec requêtes préparées

### 🔒 En-têtes de Sécurité (Helmet.js)
- **Content Security Policy** : Restriction des ressources externes
- **X-Frame-Options** : Protection contre le clickjacking
- **X-Content-Type-Options** : Prévention du MIME sniffing
- **Referrer Policy** : Contrôle des informations de référence

### 📝 Gestion des Logs
- **Sanitisation** : Exclusion des données sensibles (mots de passe, sessions)
- **Limitation** : Troncature des logs longs pour éviter l'overflow
- **Séparation** : Logs d'authentification isolés

### 🔄 Validation des Données
- **Email** : Normalisation et validation RFC compliant
- **Mots de passe** : 8+ caractères, majuscule/minuscule/chiffre requis
- **Taille des requêtes** : Limitation à 10MB pour éviter les attaques DoS
- **Sanitisation** : Nettoyage automatique des entrées utilisateur

## Configuration Requise

### Variables d'Environnement Obligatoires
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
SESSION_SECRET=your-256-bit-hex-key-here
NODE_ENV=production  # pour activer HTTPS strict
```

### Déploiement en Production
1. **HTTPS obligatoire** : Cookies sécurisés activés automatiquement
2. **CSP stricte** : Désactiver 'unsafe-eval' et 'unsafe-inline'
3. **Rate limiting** : Ajuster selon le trafic attendu
4. **Monitoring** : Surveiller les tentatives d'intrusion

## Tests de Sécurité Recommandés

### Authentification
- [ ] Tentatives de brute force (rate limiting)
- [ ] Injection dans les champs email/password
- [ ] Session hijacking et fixation
- [ ] CSRF sur les formulaires critiques

### API
- [ ] Validation des paramètres malformés
- [ ] Dépassement des limites de taille
- [ ] Accès non autorisé aux endpoints protégés
- [ ] Escalade de privilèges

### Infrastructure
- [ ] Headers de sécurité présents
- [ ] Certificats SSL/TLS valides
- [ ] Logs d'erreurs non exposés
- [ ] Variables d'environnement protégées

## Standards de Conformité

Cette application suit les recommandations OWASP Top 10 2021 :
- ✅ A01:2021 – Broken Access Control
- ✅ A02:2021 – Cryptographic Failures  
- ✅ A03:2021 – Injection
- ✅ A04:2021 – Insecure Design
- ✅ A05:2021 – Security Misconfiguration
- ✅ A06:2021 – Vulnerable Components
- ✅ A07:2021 – Authentication Failures
- ✅ A08:2021 – Software Integrity Failures
- ✅ A09:2021 – Logging Failures
- ✅ A10:2021 – Server-Side Request Forgery

## Contact Sécurité

Pour signaler une vulnérabilité, veuillez utiliser les canaux appropriés et éviter la divulgation publique jusqu'à correction.