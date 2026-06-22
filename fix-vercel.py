import os
import re

files_to_fix = [
    'src/pages/Player.jsx',
    'src/components/SetlistCard.jsx',
    'src/pages/Home.jsx',
]

for file_path in files_to_fix:
    if os.path.exists(file_path):
        print(f'🔧 Corrigindo {file_path}...')
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Corrigir operadores com espaços
        content = re.sub(r'&\s+&', '&&', content)
        content = re.sub(r'=\s+>', '=>', content)
        
        # Corrigir strings e variáveis quebradas
        content = content.replace("t` `ranslate-y-0'", "'translate-y-0'")
        content = content.replace("men uVisible", "menuVisible")
        content = content.replace("beat Count", "beatCount")
        content = content.replace("activeSecti on", "activeSection")
        content = content.replace("rou nded", "rounded")
        content = content.replace("bor der", "border")
        content = content.replace("jus tify", "justify")
        content = content.replace("ro unded", "rounded")
        
        # Corrigir regex quebrada
        content = content.replace('(?:([^)]))?', '(?:\([^)]*\))?')
        content = content.replace('/[[]()]/g', '/[\\[\\]\\(\\)]/g')
        content = content.replace('/|+$/g', '/\\|+$/g')
        
        # Corrigir <a href> no SetlistCard
        if 'SetlistCard' in file_path:
            # Substituir <a href> por <button>
            old_code = '''<a 
                  href={`/player/${song.id}`} 
                  className="flex-1 min-w-0 "
                  onClick={(e) = > e.stopPropagation()}
                 >
                   <div className= "font-semibold text-text truncate " >{song.title} </div >
                   <div className= "text-xs text-muted truncate " >{song.artist} </div >
                 </a >'''
            
            new_code = '''<button 
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate('/player/' + song.id, { state: { from: 'setlist' } })
                  }}
                  className="flex-1 min-w-0 text-left cursor-pointer hover:opacity-80 transition-opacity"
                 >
                   <div className="font-semibold text-text truncate">{song.title}</div>
                   <div className="text-xs text-muted truncate">{song.artist}</div>
                 </button>'''
            
            content = content.replace(old_code, new_code)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f'✅ {file_path} corrigido!')

print('\n🔨 Agora execute:')
print('   npm run build')
print('   git add .')
print('   git commit -m "Corrige erros de sintaxe e navegação setlist"')
print('   git push --force')