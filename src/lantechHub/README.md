# For Hub License Server

1. use forever
2. go to root path of this repo
3. run `forever start -c "npm run start" ./"

> To use the script in package.json and run with forever

# Notes

## 2023.10.04 

I found the docker droplet may keep multiple license-server running in background.
This may cause unexpected db read write problem (data level: incorrect result).
It take a long time for me to identify this problem by below command.

```
ps aux | grep babel-nod
```

A normal output should be as below but if there are many `sc -c bable-node` then the problem occurs.

```
root     1852951  0.0  0.0   2612   560 ?        S    09:54   0:00 sh -c babel-node ./src/lantechHub/license-server.js "/root/intrising/firebasePlayground/src/lantechHub/"
root     1852952  0.0  2.8 584044 28820 ?        Sl   09:54   0:00 node /root/intrising/firebasePlayground/node_modules/.bin/babel-node ./src/lantechHub/license-server.js /root/intrising/firebasePlayground/src/lantechHub/
root     1852963  1.5  7.0 815952 70856 ?        Sl   09:54   0:03 /root/.nvm/versions/node/v12.13.1/bin/node /root/intrising/firebasePlayground/node_modules/@babel/node/lib/_babel-node ./src/lantechHub/license-server.js /root/intrising/firebasePlayground/src/lantechHub/
root     1853319  0.0  0.0   8164   660 pts/0    S+   09:58   0:00 grep --color=auto --exclude-dir=.bzr --exclude-dir=CVS --exclude-dir=.git --exclude-dir=.hg --exclude-dir=.svn --exclude-dir=.idea --exclude-dir=.tox babel-nod
```
