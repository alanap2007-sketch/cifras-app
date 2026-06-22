import os
import re

# Arquivos para verificar e limpar
files_to_check = [
    'src/App.jsx',
    'src/main.jsx',
]

# Remover o arquivo useBackButton.js
back_button_path = 'src/hooks/useBackButton.js'
if os.path.exists(back_button_path):
    os.remove(back_button_path)
    print('✅ Arquivo useBackButton.js removido')
else:
    print('ℹ️ Arquivo useBackButton.js não encontrado')

# Limpar imports do Capacitor nos arquivos
for file_path in files_to_check:
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Remover imports do Capacitor
        content = re.sub(r'import.*@capacitor.*\n', '', content)
        content = re.sub(r'import.*useBackButton.*\n', '', content)
        
        # Remover uso do hook
        content = re.sub(r'useBackButton\(\);?\n?', '', content)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f'✅ {file_path} limpo')

print('\n🔨 Agora execute: npm run build')