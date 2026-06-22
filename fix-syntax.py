import os
import re

# Lista de arquivos para corrigir
files_to_fix = [
    'src/pages/Player.jsx',
    'src/pages/Home.jsx',
    'src/components/SetlistCard.jsx',
]

for file_path in files_to_fix:
    if os.path.exists(file_path):
        print(f'🔧 Corrigindo {file_path}...')
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Corrigir strings quebradas
        content = content.replace("t` `ranslate-y-0'", "'translate-y-0'")
        content = content.replace("men uVisible", "menuVisible")
        content = content.replace("beat Count", "beatCount")
        content = content.replace("activeSecti on", "activeSection")
        
        # Corrigir operadores
        content = content.replace("& &", "&&")
        content = content.replace("= >", "=>")
        content = content.replace("p = >", "p =>")
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f'✅ {file_path} corrigido!')

print('')
print('🔄 Agora rode:')
print('   npm run build')
print('   git add .')
print('   git commit -m "Corrige erros de sintaxe"')
print('   git push')