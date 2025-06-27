# Guide de déploiement sur VPS avec nom de domaine

## 1. Configuration initiale du VPS

### 1.1 Connexion au serveur
```bash
ssh root@votre_ip_serveur
```

### 1.2 Mise à jour du système
```bash
# Mettre à jour les paquets
apt update && apt upgrade -y

# Installer les outils essentiels
apt install -y curl wget git unzip build-essential
```

### 1.3 Création d'un utilisateur non-root (recommandé)
```bash
# Créer un nouvel utilisateur
adduser deploy
usermod -aG sudo deploy

# Activer l'authentification SSH par clé
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

## 2. Installation des dépendances

### 2.1 Node.js (via NVM pour une meilleure gestion des versions)
```bash
# Installer NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc  # Ou se déconnecter/recréer la session

# Installer Node.js LTS
nvm install --lts
nvm use --lts

# Vérifier l'installation
node --version
npm --version
```

### 2.2 PostgreSQL
```bash
# Installer PostgreSQL
apt install -y postgresql postgresql-contrib

# Créer un utilisateur et une base de données
sudo -u postgres createuser --interactive
sudo -u postgres createdb nutripanner

# Créer un mot de passe pour l'utilisateur PostgreSQL
sudo -u postgres psql -c "ALTER USER votre_utilisateur WITH PASSWORD 'votre_mot_de_passe';"
```

### 2.3 Nginx (comme reverse proxy)
```bash
# Installer Nginx
apt install -y nginx

# Démarrer et activer Nginx
systemctl start nginx
systemctl enable nginx

# Configurer le pare-feu
ufw allow 'Nginx Full'
ufw allow 'OpenSSH'
ufw enable
```

## 3. Configuration du nom de domaine

### 3.1 Acheter un nom de domaine
- Achetez un nom de domaine auprès d'un registrar (OVH, Namecheap, Gandi, etc.)
- Configurez les serveurs DNS pour pointer vers l'IP de votre VPS
- Ajoutez un enregistrement A pointant vers votre IP publique

### 3.2 Configurer Nginx pour le nom de domaine
```bash
# Créer un fichier de configuration pour votre site
nano /etc/nginx/sites-available/votredomaine.com
```

```nginx
server {
    listen 80;
    server_name votredomaine.com www.votredomaine.com;

    location / {
        proxy_pass http://localhost:3000;  # Port sur lequel tourne votre application
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activer le site
ln -s /etc/nginx/sites-available/votredomaine.com /etc/nginx/sites-enabled/

# Tester la configuration
nginx -t

# Redémarrer Nginx
systemctl restart nginx
```

## 4. Déploiement de l'application

### 4.1 Cloner le dépôt
```bash
# Se connecter en tant qu'utilisateur dédié
su - deploy

# Cloner le dépôt
git clone https://github.com/votre-utilisateur/nutriplanner.git
cd nutriplanner

# Installer les dépendances
npm install

# Installer les dépendances du client
cd client
npm install
npm run build
cd ..
```

### 4.2 Configuration de l'environnement
```bash
# Créer un fichier .env à la racine du projet
nano .env
```

```env
# Configuration de la base de données
DATABASE_URL=postgresql://utilisateur:motdepasse@localhost:5432/nutriplanner

# Clé secrète pour les sessions
JWT_SECRET=votre_clé_secrète_très_longue

# URL de l'API (à adapter en production)
NEXT_PUBLIC_API_URL=https://api.votredomaine.com

# Autres variables d'environnement nécessaires
NODE_ENV=production
```

## 5. Configuration de PM2 (gestionnaire de processus)

### 5.1 Installation et configuration
```bash
# Installer PM2 globalement
npm install -g pm2

# Démarrer l'application avec PM2
pm2 start npm --name "nutriplanner" -- start

# Démarrer PM2 au démarrage du système
pm2 startup
pm2 save
```

## 6. Sécurisation avec Let's Encrypt (HTTPS)

### 6.1 Installation de Certbot
```bash
# Installer Certbot et le plugin Nginx
apt install -y certbot python3-certbot-nginx

# Obtenir un certificat SSL
certbot --nginx -d votredomaine.com -d www.votredomaine.com

# Configurer le renouvellement automatique
echo "0 0,12 * * * root python -c 'import random; import time; time.sleep(random.random() * 3600)' && certbot renew -q" | sudo tee -a /etc/crontab > /dev/null
```

## 7. Finalisation

### 7.1 Vérifier que tout fonctionne
- Visitez https://votredomaine.com dans votre navigateur
- Vérifiez que le site se charge en HTTPS
- Testez les fonctionnalités principales

### 7.2 Surveillance (optionnel mais recommandé)
```bash
# Installer des outils de surveillance
apt install -y htop nmon

# Vérifier les logs en temps réel
journalctl -f -u nginx
pm2 logs
```

## 8. Mises à jour futures

Pour déployer des mises à jour :

```bash
# Se connecter au serveur
ssh deploy@votre_ip_serveur

# Aller dans le dossier de l'application
cd ~/nutriplanner

# Récupérer les dernières modifications
git pull

# Reconstruire le client
cd client
npm install
npm run build
cd ..

# Redémarrer l'application
pm2 restart nutriplanner

# Vérifier les logs en cas d'erreur
pm2 logs
```

## 9. Sauvegarde (importante !)

Configurez des sauvegardes régulières de :
- La base de données PostgreSQL
- Le fichier .env
- Les fichiers de configuration importants

Exemple de commande de sauvegarde PostgreSQL :
```bash
# Sauvegarder la base de données
pg_dump -U utilisateur -d nutriplanner > backup_$(date +%Y%m%d).sql

# (Optionnel) Compresser la sauvegarde
gzip backup_$(date +%Y%m%d).sql
```

## 10. Sécurité avancée (recommandé)

- Désactiver la connexion root par SSH
- Changer le port SSH par défaut
- Configurer fail2ban pour se protéger contre les attaques par force brute
- Mettre en place un pare-feu (UFW) avec des règles strictes
- Configurer des sauvegardes automatiques vers un stockage externe

---

Ce guide couvre les étapes essentielles pour déployer votre application NutriPlanner sur un VPS avec un nom de domaine. N'oubliez pas de personnaliser les paramètres (mots de passe, noms de domaine, etc.) selon vos besoins spécifiques.
