'use strict';
// const { BrowserWindow } = require('electron');
const isAccelerator = require('electron-is-accelerator');
const equals = require('keyboardevents-areequal');
const { toKeyEvent } = require('keyboardevent-from-electron-accelerator');

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

	for (const shortcut of shortcutsOfWindow.shortcuts) {
		shortcut.enabled = false;
	}
}

/**
 * @param  {BrowserWindow} win
 */
function enableAll(win) {
	const wc = win.webContents;
	const shortcutsOfWindow = windowsWithShortcuts.get(wc);

	for (const shortcut of shortcutsOfWindow.shortcuts) {
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

const _onBeforeInput = shortcutsOfWindow => (e, input) => {
	if (input.type === 'keyUp') {
		return;
	}

	const event = _normalizeEvent(input);

	for (const { eventStamp, callback, enabled } of shortcutsOfWindow.shortcuts) {
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
	const wc = win.webContents;

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
		shortcutsOfWindow = {
			shortcuts: []
		};
		windowsWithShortcuts.set(wc, shortcutsOfWindow);

		const keyHandler = _onBeforeInput(shortcutsOfWindow);
		wc.on('before-input-event', keyHandler);

		// Save a reference to allow remove of listener from elsewhere
		shortcutsOfWindow.removeListener = () =>
			wc.removeListener('before-input-event', keyHandler);
		wc.once('closed', shortcutsOfWindow.removeListener);
	}


	const eventStamp = toKeyEvent(accelerator);

	shortcutsOfWindow.shortcuts.push({
		eventStamp,
		callback,
		enabled: true
	});
}

/**
 * @param  {BrowserWindow} win
 * @param  {String|Array<String>} accelerator
 * @param  {Function} callback
 */
function unregister(win, accelerator, callback = undefined) {
	if (win.isDestroyed()) return;

	const wc = win.webContents;

	if (Array.isArray(accelerator) === true) {
		accelerator.forEach(accelerator => {
			if (typeof accelerator === 'string') {
				unregister(win, accelerator, callback);
			}
		});
		return;
	}


	_checkAccelerator(accelerator);


	if (!windowsWithShortcuts.has(wc)) return;

	const shortcutsOfWindow = windowsWithShortcuts.get(wc);

	const eventStamp = toKeyEvent(accelerator);

	if (callback) {
		shortcutsOfWindow.shortcuts = shortcutsOfWindow.shortcuts.filter(sc => !(equals(sc.eventStamp, eventStamp) && sc.callback === callback));
	} else {
		shortcutsOfWindow.shortcuts = shortcutsOfWindow.shortcuts.filter(sc => !equals(sc.eventStamp, eventStamp));
	}

	// If the window has no more shortcuts,
	// we remove it early from the WeakMap
	// and unregistering the event listener
	if (shortcutsOfWindow.shortcuts.length === 0) {
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
	console.log(shortcutsOfWindow.shortcuts);
	const eventStamp = toKeyEvent(accelerator);

	return shortcutsOfWindow.shortcuts.filter(sc => equals(sc.eventStamp, eventStamp)).length !== 0;
}

module.exports = {
	register,
	unregister,
	isRegistered,
	unregisterAll,
	enableAll,
	disableAll
};
