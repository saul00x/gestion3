#!/usr/bin/env python
"""
Script pour configurer la base de données MySQL pour StockPro
"""
import mysql.connector
from mysql.connector import Error
import os
from decouple import config

def create_database():
    """Créer la base de données si elle n'existe pas"""
    try:
        # Connexion à MySQL sans spécifier de base de données
        connection = mysql.connector.connect(
            host=config('DB_HOST', default='localhost'),
            user=config('DB_USER', default='root'),
            password=config('DB_PASSWORD', default='')
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            # Créer la base de données
            database_name = config('DB_NAME', default='stockpro_db')
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {database_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            
            print(f"✅ Base de données '{database_name}' créée avec succès!")
            
            cursor.close()
            connection.close()
            
    except Error as e:
        print(f"❌ Erreur lors de la création de la base de données: {e}")

def create_superuser():
    """Créer un superutilisateur Django"""
    import django
    import os
    
    # Configuration Django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'stockpro_backend.settings')
    django.setup()
    
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    # Vérifier si un superutilisateur existe déjà
    if User.objects.filter(is_superuser=True).exists():
        print("✅ Un superutilisateur existe déjà.")
        return
    
    # Créer le superutilisateur
    try:
        admin_user = User.objects.create_user(
            email='admin@stockpro.com',
            password='admin123',
            nom='Admin',
            prenom='StockPro',
            role='admin',
            is_staff=True,
            is_superuser=True
        )
        print("✅ Superutilisateur créé:")
        print("   Email: admin@stockpro.com")
        print("   Mot de passe: admin123")
        print("   ⚠️  Changez ce mot de passe en production!")
        
    except Exception as e:
        print(f"❌ Erreur lors de la création du superutilisateur: {e}")

if __name__ == "__main__":
    print("🚀 Configuration de la base de données StockPro...")
    print("=" * 50)
    
    # Étape 1: Créer la base de données
    print("1. Création de la base de données...")
    create_database()
    
    # Étape 2: Appliquer les migrations
    print("\n2. Application des migrations Django...")
    os.system("python manage.py makemigrations")
    os.system("python manage.py migrate")
    
    # Étape 3: Créer le superutilisateur
    print("\n3. Création du superutilisateur...")
    create_superuser()
    
    print("\n" + "=" * 50)
    print("✅ Configuration terminée!")
    print("\n📋 Prochaines étapes:")
    print("1. Démarrez le serveur Django: python manage.py runserver")
    print("2. Accédez à l'admin: http://localhost:8000/admin/")
    print("3. Connectez-vous avec admin@stockpro.com / admin123")
    print("4. Démarrez le frontend React sur le port 5173")