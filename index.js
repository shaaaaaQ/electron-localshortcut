'use strict';
const { app, BrowserWindow } = require('electron');
const isAccelerator = require('electron-is-accelerator');
const equals = require('keyboardevents-areequal');
const { toKeyEvent } = require('keyboardevent-from-electron-accelerator');

// A placeholder to register shortcuts
// on any window of the app.
const ANY_WINDOW = {};

const windowsWithShortcuts = new WeakMap();

function _checkAccelerator(accelerator) {
	if (!isAccelerator(accelerator)) {
		const w = {};
		Error.captureStackTrace(w);
		const stack = w.stack ? w.stack : w.message;
		const msg = `WARNING: ${accelerator} is not a valid accelerator.\n${stack}`;
		console.error(msg);
	}
}

/**
 * @param  {BrowserWindow} win
 */
function disableAll(win) {
	const wc = win.webContents;
	const shortcutsOfWindow = windowsWithShortcuts.get(wc);

	for (const shortcut of shortcutsOfWindow) {
		shortcut.enabled = false;
	}
}

/**
 * @param  {BrowserWindow} win
 */
function enableAll(win) {
	const wc = win.webContents;
	const shortcutsOfWindow = windowsWithShortcuts.get(wc);

	for (const shortcut of shortcutsOfWindow) {
		shortcut.enabled = true;
	}
}

/**
 * @param  {BrowserWindow} win
 */
function unregisterAll(win) {
	const wc = win.webContents;
	const shortcutsOfWindow = windowsWithShortcuts.get(wc);
	if (shortcutsOfWindow && shortcutsOfWindow.removeListener) {
		// Remove listener from window
		shortcutsOfWindow.removeListener();
		windowsWithShortcuts.delete(wc);
	}
}

function _normalizeEvent(input) {
	const normalizedEvent = {
		code: input.code,
		key: input.key
	};

	['alt', 'shift', 'meta'].forEach(prop => {
		if (typeof input[prop] !== 'undefined') {
			normalizedEvent[`${prop}Key`] = input[prop];
		}
	});

	if (typeof input.control !== 'undefined') {
		normalizedEvent.ctrlKey = input.control;
	}

	return normalizedEvent;
}

function _findShortcut(event, shortcutsOfWindow) {
	let i = 0;
	for (const shortcut of shortcutsOfWindow) {
		if (equals(shortcut.eventStamp, event)) {
			return i;
		}

		i++;
	}

	return -1;
}

const _onBeforeInput = shortcutsOfWindow => (e, input) => {
	if (input.type === 'keyUp') {
		return;
	}

	const event = _normalizeEvent(input);

	for (const { eventStamp, callback, enabled } of shortcutsOfWindow) {
		if (equals(eventStamp, event) && enabled) {
			callback();
		}
	}
};

/**
 * @param  {BrowserWindow} win
 * @param  {String|Array<String>} accelerator
 * @param  {Function} callback
 */
function register(win, accelerator, callback) {
	let wc;
	if (typeof callback === 'undefined') {
		wc = ANY_WINDOW;
		callback = accelerator;
		accelerator = win;
	} else {
		wc = win.webContents;
	}

	if (Array.isArray(accelerator) === true) {
		accelerator.forEach(accelerator => {
			if (typeof accelerator === 'string') {
				register(win, accelerator, callback);
			}
		});
		return;
	}

	_checkAccelerator(accelerator);


	let shortcutsOfWindow;
	if (windowsWithShortcuts.has(wc)) {
		shortcutsOfWindow = windowsWithShortcuts.get(wc);
	} else {
		shortcutsOfWindow = [];
		windowsWithShortcuts.set(wc, shortcutsOfWindow);

		if (wc === ANY_WINDOW) {
			const keyHandler = _onBeforeInput(shortcutsOfWindow);
			const enableAppShortcuts = (e, win) => {
				const wc = win.webContents;
				wc.on('before-input-event', keyHandler);
				wc.once('closed', () =>
					wc.removeListener('before-input-event', keyHandler)
				);
			};

			// Enable shortcut on current windows
			const windows = BrowserWindow.getAllWindows();

			windows.forEach(win => enableAppShortcuts(null, win));

			// Enable shortcut on future windows
			app.on('browser-window-created', enableAppShortcuts);

			shortcutsOfWindow.removeListener = () => {
				const windows = BrowserWindow.getAllWindows();
				windows.forEach(win =>
					win.webContents.removeListener('before-input-event', keyHandler)
				);
				app.removeListener('browser-window-created', enableAppShortcuts);
			};
		} else {
			const keyHandler = _onBeforeInput(shortcutsOfWindow);
			wc.on('before-input-event', keyHandler);

			// Save a reference to allow remove of listener from elsewhere
			shortcutsOfWindow.removeListener = () =>
				wc.removeListener('before-input-event', keyHandler);
			wc.once('closed', shortcutsOfWindow.removeListener);
		}
	}


	const eventStamp = toKeyEvent(accelerator);

	shortcutsOfWindow.push({
		eventStamp,
		callback,
		enabled: true
	});
}

/**
 * @param  {BrowserWindow} win
 * @param  {String|Array<String>} accelerator
 */
function unregister(win, accelerator) {
	let wc;
	if (typeof accelerator === 'undefined') {
		wc = ANY_WINDOW;
		accelerator = win;
	} else {
		if (win.isDestroyed()) return

		wc = win.webContents;
	}

	if (Array.isArray(accelerator) === true) {
		accelerator.forEach(accelerator => {
			if (typeof accelerator === 'string') {
				unregister(win, accelerator);
			}
		});
		return;
	}


	_checkAccelerator(accelerator);


	if (!windowsWithShortcuts.has(wc)) return

	const eventStamp = toKeyEvent(accelerator);

	windowsWithShortcuts.set(wc, windowsWithShortcuts.get(wc).filter(sc => !equals(sc.eventStamp, eventStamp)))

	const shortcutsOfWindow = windowsWithShortcuts.get(wc);

	// If the window has no more shortcuts,
	// we remove it early from the WeakMap
	// and unregistering the event listener
	if (shortcutsOfWindow.length === 0) {
		// Remove listener from window
		shortcutsOfWindow.removeListener();

		// Remove window from shortcuts catalog
		windowsWithShortcuts.delete(wc);
	}
}

/**
 * @param  {BrowserWindow} win
 * @param  {String} accelerator
 * @return {Boolean}
 */
function isRegistered(win, accelerator) {
	_checkAccelerator(accelerator);
	const wc = win.webContents;
	const shortcutsOfWindow = windowsWithShortcuts.get(wc);
	//console.log(shortcutsOfWindow)
	const eventStamp = toKeyEvent(accelerator);

	return _findShortcut(eventStamp, shortcutsOfWindow) !== -1;
}

module.exports = {
	register,
	unregister,
	isRegistered,
	unregisterAll,
	enableAll,
	disableAll
};
