import pexpect
import sys

password = "a2Nrr'.ILmG?*M"
command = "rsync -avz --exclude 'node_modules' --exclude '.git' -e 'ssh -o StrictHostKeyChecking=no' /home/vicdejor/fe-manager/ videjor@vicdejor.tplinkdns.com:/home/vicdejor/fe-manager"

child = pexpect.spawn(command, encoding='utf-8')
child.logfile = sys.stdout

idx = child.expect(['(?i)password:', '(?i)contraseña:', pexpect.EOF, pexpect.TIMEOUT], timeout=30)
if idx == 0 or idx == 1:
    child.sendline(password)
    child.expect(pexpect.EOF, timeout=300)
    print("\nFINISHED SUCCESS")
elif idx == 2:
    print("EOF reached prematurely")
elif idx == 3:
    print("Timeout waiting for password prompt")
