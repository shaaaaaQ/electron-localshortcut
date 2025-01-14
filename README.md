# electron-localshortcut

A module to register/unregister a keyboard shortcut
locally to a BrowserWindow instance, without using a Menu.

# Usage

```javascript
	const electronLocalshortcut = require('electron-localshortcut');
	const BrowserWindow = require('electron').BrowserWindow;

	const win = new BrowserWindow();
	win.loadUrl('https://github.com');
	win.show();

	electronLocalshortcut.register(win, 'Ctrl+A', () => {
		console.log('You pressed ctrl & A');
	});

	electronLocalshortcut.register(win, 'Ctrl+B', () => {
		console.log('You pressed ctrl & B');
	});

	electronLocalshortcut.register(win, ['Ctrl+R', 'F5'], () => {
        console.log('You pressed ctrl & R or F5');
    });

	console.log(
		electronLocalshortcut.isRegistered(win, 'Ctrl+A')
	);      // true

	electronLocalshortcut.unregister(win, 'Ctrl+A');
	electronLocalshortcut.unregisterAll(win);
```

# API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

## disableAll

Disable all of the shortcuts registered on the BrowserWindow instance.
Registered shortcuts no more works on the `window` instance, but the module
keep a reference on them. You can reactivate them later by calling `enableAll`
method on the same window instance.

**Parameters**

-   `win` **BrowserWindow** BrowserWindow instance

Returns **[Undefined](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/undefined)**

## enableAll

Enable all of the shortcuts registered on the BrowserWindow instance that
you had previously disabled calling `disableAll` method.

**Parameters**

-   `win` **BrowserWindow** BrowserWindow instance

Returns **[Undefined](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/undefined)**

## unregisterAll

Unregisters all of the shortcuts registered on any focused BrowserWindow
instance. This method does not unregister any shortcut you registered on
a particular window instance.

**Parameters**

-   `win` **BrowserWindow** BrowserWindow instance

Returns **[Undefined](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/undefined)**

## register

Registers the shortcut `accelerator`on the BrowserWindow instance.

**Parameters**

-   `win` **BrowserWindow** BrowserWindow instance to register.
-   `accelerator` **([String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) \| [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>)** the shortcut to register
-   `callback` **[Function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)** This function is called when the shortcut is pressed
    and the window is focused and not minimized.

Returns **[Undefined](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/undefined)**

## unregister

Unregisters the shortcut of `accelerator` registered on the BrowserWindow instance.

**Parameters**

-   `win` **BrowserWindow** BrowserWindow instance to unregister.
-   `accelerator` **([String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) \| [Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>)** the shortcut to unregister

Returns **[Undefined](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/undefined)**

## isRegistered

Returns `true` or `false` depending on whether the shortcut `accelerator`
is registered on `window`.

**Parameters**

-   `win` **BrowserWindow** BrowserWindow instance to check.
-   `accelerator` **[String](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** the shortcut to check

Returns **[Boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)**

# License

The MIT License (MIT)

Copyright (c) 2017 Andrea Parodi
