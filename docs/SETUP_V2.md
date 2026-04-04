# Setup V2 — Authentification EVE SSO + PostgreSQL

## Prérequis

- Compte [Neon](https://neon.tech) (gratuit)
- Compte CCP / EVE Online actif

---

## 1. Base de données Neon

1. Créer un compte sur [neon.tech](https://neon.tech)
2. Créer un nouveau projet (ex: `tabou-corp`)
3. Dans **Connection Details**, copier la **Connection string (pooled)**
4. Elle ressemble à : `postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`

---

## 2. Application EVE SSO

1. Aller sur [developers.eveonline.com](https://developers.eveonline.com/)
2. Se connecter avec votre compte EVE
3. Cliquer **Create New Application**
4. Remplir :
   - **Name** : `Tabou Corporation Site`
   - **Description** : Site de la corporation Tabou
   - **Connection Type** : `Authentication Only`
   - **Callback URL** :
     - Dev : `http://localhost:3000/api/auth/callback/eveonline`
     - Prod : `https://votre-domaine.fr/api/auth/callback/eveonline`
   - **Scopes** : `publicData`
5. Cliquer **Create Application**
6. Noter le **Client ID** et le **Secret Key**

---

## 3. Variables d'environnement

Copier `.env.example` en `.env.local` et remplir :

```bash
cp .env.example .env.local
```

```env
DATABASE_URL="postgresql://..."         # Votre chaîne Neon
AUTH_SECRET="..."                       # openssl rand -base64 32
EVE_CLIENT_ID="votre-client-id"
EVE_CLIENT_SECRET="votre-secret"
NEXTAUTH_URL="http://localhost:3000"
```

Générer un AUTH_SECRET sécurisé :
```bash
openssl rand -base64 32
```

---

## 4. Migration base de données

```bash
npm run db:migrate
# Entrer un nom : "init"
```

Cela crée les tables : `users`, `accounts`, `sessions`, `verification_tokens`.

En cas de besoin (dev uniquement, sans fichier de migration) :
```bash
npm run db:push
```

---

## 5. Démarrer

```bash
npm run dev
```

---

## 6. Premier test

1. Aller sur `http://localhost:3000`
2. Cliquer **Connexion** dans la nav
3. Cliquer **Se connecter avec EVE Online**
4. Autoriser l'application sur le portail EVE
5. Vous êtes redirigé vers `/membre`

Le compte créé a le rôle `candidate` par défaut.

---

## 7. Passer un compte en `member` (admin manuel)

Pour le moment (avant V5), la gestion des rôles se fait directement en base.

Via Prisma Studio :
```bash
npm run db:studio
```

Ou via SQL :
```sql
UPDATE users SET role = 'member' WHERE name = 'NomDuPersonnage';
```

Rôles disponibles : `candidate` | `member` | `recruiter` | `officer` | `admin`
