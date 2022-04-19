# Factory-Engine
C'est un moteur de template, rien de plus normal :)

## Utiliser la syntaxe (Syntaxe)
Factory fonctionne avec des blocks de commandes qui lui sont propres. Ces blocks sont définit via `<<` et `>>` et le code factory se trouvera entre ces flèches.

### Types de données

`ovar` est une variable propre au fichier ou à ses parents<br>
`ivar` est une variable d'un fichier enfant<br>
`file` est le contenu du fichier donné<br>
`req` est une requête à votre base de donnée<br>
`block` est un morceau de code autre que Factory, mais celui-ci, peut, bien-sûr, contenir une intégration Factory via les blocks de commande ou les variables<br>
`id` est un identifiant définit par l'utilisateur en JavaScript

**Ils sont utilisés comme suit**

`ovar:le_nom_de_variable`<br>
`ivar:le_nom_de_variable`<br>
`file:'le/chemin/vers/le/fichier'` *Précision : `./` est égal à la racine du projet, soit, le dossier dans lequel le fichier principal a été lancé.*<br>
`req:'la_requête'`

et le dernier :

```fc
block:{
	Le code, ici
}
```

**Commandes Factory**<br>
Certains d'entre eux peuvent avoir des identifiants<br>
Ceux-ci sont utilisés pour définir un contenu à modifié pendant l'exécution de Factory.<br>
Les identifiants sont défini comme suit : `$` + un entier.

> `[$value=]INSERT (file:'path' | ovar:variable);

Celle-ci est remplacée par le contenu de l'`ovar` ou du `file`.
```
INSERT datatype;
```

Avec un identifiant, seulement `file` peut être utilisé, où le fichier sera modifié avant de remplacer la commande par son nouveau contenu.


```fc
$1 = INSERT file:'le/fichier';
```

> `SET [$value::]variable BY (file:'path'; | block:{ <code> } | ovar:variable;)`

Celle-ci permet de remplacer une `ovar` ou une `ivar` par un autre contenu.<br>
Trois types de données autorisés : `file`, `block` et `ovar`.<br>
*`block` n'autorise pas de terminer par un point-virgule !* 

```fc
SET variable BY datatype;
```

Avec un identifiant associé, la variable du contenu désigné par l'identifiant pourr être remplacé par le nouveau contenu.

```fc
SET $1::variable BY datatype;
```

> `IF(variable (== | !=) comparison); <code> BREAK;`

***INSTABLE***<br>
Celui-ci, permet simplement de vérifier une comparaison entre une variable `ovar` et un contenu pour exécuter ou pas le code Factory entre le mot clé `IF` et le `BREAK`.<br>
2 types de comparaison : `==` (une égalité) et `!=` (une inégalité)


```fc
IF(variable == comparison);
 <- Votre code -#>
BREAK;
```
Où `comparison` est soit une string, un decimal, un entier, un booléen ou d'une valeur *`null`*.

> `EXECUTE( (req | file | id):'content' ) [WITH (file:'path'; | block:{ <code> })]`

Celui-ci permet de soit dump le résultat (de type array\<dict\>) de la ou les requêtes, ou d'itérer le résultat sur un fichier ou un block de code.<br>
3 types sont acceptés : `req`, `file` et `id`

```fc
EXECUTE(datatype);
```

Ainsi, pour l'itération : 
```fc
EXECUTE(datatype) WITH datatype2;
```

`datatype2` omet deux possibilités : `file` ou `block`.

## Utilisation en JavaScript
```bat
npm i factory-engine
```

```js
const factory = require("factory-engine");
```

Dès son import, 3 fonctions sont disponibles : 

- parse
- parseFile
- onDBRequest (à redéfinir)

### parse
Permet de convertir un contenu Factory en un contenu HTML.
> 2 arguments obligatoires
> - str: un contenu, n'importe lequel, qui sera transformé si possible
> - dict: les ovars insuflées dans l'interpréteur

### parseFile
Permet de convertir un contenu Factory en un contenu HTML.
> 2 arguments obligatoires
> - str: le chemin vers le fichier selon la racine du projet
> - dict: les ovars insuflées dans l'interpréteur

### onDBRequest
Permet de récupérer la ou les requêtes utilisées dans le Factory (commande `EXECUTE`).<br>
Celle-ci est à redéfinir, mais 1 argument est envoyé par Factory.
> - dict: les informations de la ou les requêtes

*Celle-ci oblige un return de type array\<dict\> une fois redéfinie. Ce return est le résultat de la requête.*


## Exemples
Imaginons qu'une variable grlobale nommée `age` étant égale à 15.

`./index.js`
```js
const factory = require("factory-engine");
console.log(parseFile("./src/index.f.html", {
	age: 15
}));
```

*`./src/index.f.html`*
```html
<p>{{ovar:age}}</p>
```
Ce fichier est parsé et le résultat dans le navigateur est simplement :

<u>**Résultat**</u>
```html
<p>15</p>
```
<br>
Maintenant, nous voulons passer par Factory pour passer la variable globale `age` à une `ivar`.

*`./src/other.f.html`*
```html
<p>{{ovar:integer}}</p>
```

*`./src/index.f.html`*
```html
<<
	<# Permet de mettre le contenu de other.f.html dans l'identifiant $1 #>
	$1 = INSERT file:'./src/other.f.html';

	<# Signifie que la variable 'integer' de l'identifiant $1 est égale à l'ovar 'age' #>
	SET $1::integer BY ovar:age;
>>
```

<u>**Résultat**</u>
```html
<p>15</p>
```
<br>
Maintenant, nous voulons exécuter une requête et retourner le résultat

`./index.js`
```js
const factory = require("factory-engine");
console.log(parseFile("./src/index.f.html", {}));

factory.onDBRequest = (data) => {
	// data.req = "SELECT * FROM ``users";
	// Cette requête sera interpréter avec le module du type de base de données de votre choix

	return [
		{
			"name": "Bouchetrou",
			"email": "bouche@gmal.com"
		},
		{
			"name": "Marie",
			"email": "marie@domaine.com"
		}
	];
}
```

*`./src/index.f.html`*
```html
<<
	<# Permet de dump le résultat de notre requête #>
	EXECUTE(req:'SELECT * FROM `users`;');
>>
```

<u>**Résultat**</u>
```html
<pre>
[
	{
		"name": "Bouchetrou",
		"email": "bouche@gmal.com"
	},
	{
		"name": "Marie",
		"email": "marie@domaine.com"
	}
]
</pre>
```

Mais, nous voulons ordonner ces valeurs et les styliser

*`./src/other.f.html`*
```html
<div>
	<p>Nom : {{ovar:name}}</p>
	<b>Email : {{ovar:email}}</b>
</div>
```

*`./src/index.f.html`*
```html
<<
	<# Permet d'itérer le résultat de notre requête sur le fichier other.f.html $1 #>
	EXECUTE(req:'SELECT * FROM `users`;') WITH file:'./src/other.f.html';
>>
```

<u>**Résultat**</u>
```html
<div>
	<p>Nom : Bouchetrou</p>
	<b>Email : bouche@gmal.com</b>
</div>
<div>
	<p>Nom : Marie</p>
	<b>Email : marie@domaine.com</b>
</div>
```