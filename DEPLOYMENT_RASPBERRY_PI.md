# Guide de déploiement sur Raspberry Pi

## Prérequis sur la Raspberry Pi

### 1. Système d'exploitation et mises à jour
```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer les dépendances essentielles
sudo apt install -y curl wget git build-essential
```

### 2. Installation Node.js (version 20+)
```bash
# Installation via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Vérifier l'installation
node --version
npm --version
```

### 3. Installation PostgreSQL
```bash
# Installer PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Démarrer et activer PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Créer un utilisateur et une base de données
sudo -u postgres createuser --interactive
sudo -u postgres createdb votre_nom_app
```

## Préparation du projet

### 4. Cloner et préparer l'application
```bash
# Créer un dossier pour l'application
mkdir ~/meal-planning-app
cd ~/meal-planning-app

# Cloner le projet (adaptez selon votre méthode de transfert)
git clone [votre-repo] .
# OU transférer les fichiers via SCP/SFTP

# Installer les dépendances
npm install

# Installer PM2 pour la gestion des processus
sudo npm install -g pm2
```

### 5. Configuration de l'environnement
```bash
# Créer le fichier .env
cp .env.example .env

# Éditer le fichier .env avec vos configurations
nano .env
```

Configuration .env pour production :
```
DATABASE_URL=postgresql://username:password@localhost:5432/votre_nom_app
NODE_ENV=production
PORT=3000
JWT_SECRET=votre_jwt_secret_très_sécurisé_32_caractères_minimum
OPENAI_API_KEY=votre_clé_openai_si_nécessaire
```

### 6. Initialisation de la base de données
```bash
# Appliquer les migrations
npm run db:push

# Vérifier que la base fonctionne
npm run dev # Test rapide puis Ctrl+C
```

## Configuration de la sécurité

### 7. Firewall (UFW)
```bash
# Installer et configurer UFW
sudo apt install -y ufw

# Règles de base
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Autoriser SSH (adaptez le port si modifié)
sudo ufw allow 22/tcp

# Autoriser votre port d'application
sudo ufw allow 3000/tcp

# Activer le firewall
sudo ufw enable
```

### 8. Configuration de sécurité réseau
```bash
# Créer un utilisateur dédié pour l'application
sudo adduser --disabled-password meal-app
sudo usermod -aG sudo meal-app

# Transférer l'ownership des fichiers
sudo chown -R meal-app:meal-app ~/meal-planning-app
```

### 9. Configuration SSL/HTTPS avec Nginx (recommandé)
```bash
# Installer Nginx
sudo apt install -y nginx

# Créer la configuration Nginx
sudo nano /etc/nginx/sites-available/meal-planning
```

Configuration Nginx :
```nginx
server {
    listen 80;
    server_name votre_ip_raspberry;

    # Redirection HTTPS (optionnel mais recommandé)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name votre_ip_raspberry;

    # Certificats SSL auto-signés (voir étape 10)
    ssl_certificate /etc/ssl/certs/meal-planning.crt;
    ssl_certificate_key /etc/ssl/private/meal-planning.key;

    # Configuration SSL sécurisée
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Headers de sécurité
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 10. Génération de certificats SSL auto-signés
```bash
# Créer le certificat auto-signé
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/meal-planning.key \
    -out /etc/ssl/certs/meal-planning.crt \
    -subj "/C=FR/ST=State/L=City/O=Organization/CN=votre_ip_raspberry"

# Activer la configuration Nginx
sudo ln -s /etc/nginx/sites-available/meal-planning /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Déploiement et mise en production

### 11. Construction de l'application
```bash
# Basculer vers l'utilisateur meal-app
sudo su - meal-app
cd ~/meal-planning-app

# Build de production
npm run build
```

### 12. Configuration PM2 pour la production
```bash
# Créer le fichier ecosystem PM2
nano ecosystem.config.js
```

Contenu du fichier ecosystem.config.js :
```javascript
module.exports = {
  apps: [{
    name: 'meal-planning',
    script: 'server/index.ts',
    interpreter: 'node',
    interpreter_args: '--loader tsx',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

### 13. Lancement de l'application
```bash
# Démarrer avec PM2
pm2 start ecosystem.config.js

# Sauvegarder la configuration PM2
pm2 save

# Configurer PM2 pour démarrer au boot
pm2 startup
# Suivre les instructions affichées
```

## Configuration réseau et accès

### 14. Configuration du routeur (Box Internet)
1. Accéder à l'interface d'administration de votre box
2. Configurer le port forwarding :
   - Port externe : 443 (HTTPS)
   - Port interne : 443
   - IP de destination : IP locale de votre Raspberry Pi
3. Optionnel : Port 80 pour redirection HTTP → HTTPS

### 15. Partage de l'accès avec vos amis
- Communiquer votre IP publique externe (visible sur whatismyip.com)
- Format d'accès : `https://votre_ip_publique`
- Les utilisateurs devront accepter le certificat auto-signé dans leur navigateur

## Sécurité avancée

### 16. Fail2Ban pour protection contre les attaques
```bash
# Installer Fail2Ban
sudo apt install -y fail2ban

# Configuration basique
sudo nano /etc/fail2ban/jail.local
```

Configuration Fail2Ban :
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true
```

### 17. Monitoring et logs
```bash
# Voir les logs de l'application
pm2 logs meal-planning

# Voir les logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Monitoring PM2
pm2 monit
```

## Maintenance

### 18. Mise à jour de l'application
```bash
# Arrêter l'application
pm2 stop meal-planning

# Mettre à jour le code
git pull origin main
npm install

# Appliquer les migrations si nécessaire
npm run db:push

# Reconstruire si nécessaire
npm run build

# Redémarrer
pm2 start meal-planning
```

### 19. Sauvegarde de la base de données
```bash
# Créer un script de sauvegarde
nano ~/backup_db.sh
```

Script de sauvegarde :
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump votre_nom_app > ~/backups/db_backup_$DATE.sql
# Garder seulement les 7 derniers backups
find ~/backups -name "db_backup_*.sql" -type f -mtime +7 -delete
```

### 20. Automatisation des sauvegardes
```bash
# Créer le dossier de sauvegarde
mkdir ~/backups

# Rendre le script exécutable
chmod +x ~/backup_db.sh

# Ajouter une tâche cron (sauvegarde quotidienne à 2h)
crontab -e
# Ajouter : 0 2 * * * /home/meal-app/backup_db.sh
```

## Notes importantes

**Sécurité maintenue :**
- Authentification JWT avec tokens sécurisés
- Rate limiting sur les endpoints sensibles
- Validation des données côté serveur
- Headers de sécurité via Nginx
- Firewall configuré
- HTTPS avec certificats

**Performance :**
- PM2 pour la gestion des processus
- Nginx comme reverse proxy
- Base de données PostgreSQL optimisée

**Accès externe sécurisé :**
- Certificats SSL (même auto-signés)
- Protection Fail2Ban
- Logs d'accès monitorizés

Votre application conservera tous les aspects sécuritaires implémentés tout en étant accessible à vos amis via votre IP publique.