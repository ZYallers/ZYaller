# Warning about "php cs fixer"

> <https://github.com/Glavin001/atom-beautify/issues/1732>

## Description

An alert appears after updating to version 0.30.2.

> The "PHP - PHP-CS-Fixer Path (cs_fixer_path)" configuration option has been deprecated. Please switch to using the option named "Executables - PHP-CS-Fixer - Path" in Atom-Beautify package settings now.

There was no problem in previous versions. How should we solve it?

## I will elaborate.

Go into Atom-Beautify package settings.

### Before (currently what you have):

![image](https://user-images.githubusercontent.com/1885333/27331510-262ae394-5594-11e7-8fc4-4b751731087c.png)

Delete it from there.

### After (new correct way):

![image](https://user-images.githubusercontent.com/1885333/27331542-495b48d6-5594-11e7-9464-6fd4a55306a8.png)

Does this help?
