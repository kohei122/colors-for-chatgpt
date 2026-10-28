"""Embed the same read-only policy in runtime and standalone Console diagnostic."""
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
start='  // BEGIN GENERATED TOOLTIP POLICY'
end='  // END GENERATED TOOLTIP POLICY'
block=start+'\n'+'\n'.join('  '+line if line else '' for line in (root/'tools/tooltip-policy.js').read_text(encoding='utf-8').rstrip().splitlines())+'\n'+end
for name in ['content.js','diagnostics/tooltip-layout.js']:
 p=root/name;s=p.read_text(encoding='utf-8');a=s.index(start);b=s.index(end,a)+len(end)
 updated=s[:a]+block+s[b:]
 if '--check' in sys.argv:
  assert updated==s, name+' policy is stale'
 else:p.write_text(updated,encoding='utf-8',newline='\n')
print('Tooltip policy copies match' if '--check' in sys.argv else 'Tooltip policy synchronized')
