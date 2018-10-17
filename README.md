# ApkDecompiler
Decompiles an APK to _dex_, _class_, _jar_, _smali_ and _java_ files.

# Instructions
Clone the repository. Run
`npm install`
to install dependencies.

Now simply run `npm run [apk location] [destination folder]`.

Results will be saved on the destination folder with the following structure:
* _**classFiles**_: Folder with the _jar_ files and decompressed jars (_class_ files) of the APK.
* _**dex**_: Folder with the _dex_ files of the APK.
* _**java**_: Folder with a folder for each _dex_ file with the _java_ files.
* _**smali**_: Folder with a folder for each _dex_ file with the _smali_ files.

You must have Java and node installed on your machine for it to run.

# How does it work?
This is a node.js script that decompiles any given APK to _dex_, _class_, _jar_, _smali_ and _java_, all at the same run. To do this, it uses several tools that help it go step by step. First, it extracts the _dex_ files from the APK using [yauzl](https://www.npmjs.com/package/yauzl). Then, using that result, it converts all the _dex_ files into _smali_ using [backsmali](https://github.com/pxb1988/dex2jar). Also, with the same _dex_ files, it converts them into _class_ files using [dex2jar](https://github.com/pxb1988/dex2jar). After creating the _class_ files, it zips them into _jar_ files to be able to transform them into Java code using [decompiler](https://bitbucket.org/mstrobel/procyon/wiki/Java%20Decompiler).
