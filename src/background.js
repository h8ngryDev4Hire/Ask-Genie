import setup from './setup.json';
import { checkExistingKeys, getConfigurations, REQUESTS } from './util.js'

// Variable initializations
const URL_PATTERN = "https://";



//
// First Time Use Setup Listener
//

	if (chrome.runtime.onInstalled !== undefined) {
		chrome.runtime.onInstalled.addListener(async (details) => {
			// Send to chrome.storage API
			const config = await getConfigurations()
			

			if (details.reason === "install") {
				if (typeof config === 'object' ) {
					// CONFIGURATIONS object detected
					console.log("Prexisting config object returned.")
					console.log("Running key validation check...")
					const { successful } = await checkExistingKeys()
					config.KEYS_EXIST = successful

					chrome.storage.sync.set({ "CONFIGURATIONS": config })
				} else {
					// CONFIGURATIONS is empty
					console.log("config object returned is empty. Creating new one...")
					console.log("Running key validation check...")
					const { successful } = await checkExistingKeys()
					setup.KEYS_EXIST = successful

					chrome.storage.sync.set({ "CONFIGURATIONS": setup })
					console.log("Config load successful")
	
					console.log(await chrome.storage.sync.get("CONFIGURATIONS"))
				}
			}	
		})
	}	




// FUNCTIONS


//
// This function changes extension icon to indicate to user that the active page they are viewing 
// is not supported by the extension.
//


const setExtensionStatus = (enabled, tabID) => {
	const path = enabled ? "icon-enabled.png" : "icon-disabled.png";
	chrome.action.setIcon({ path: { "64": path } })

	if (enabled) chrome.action.enable(tabID)
	else chrome.action.disable(tabID)
}


//
// This function queries the chrome.tabs API for active tab info to determine setExtensionStatus()'s
// execution.
//


const queryChromeAPI = (URL) => {
	chrome.tabs.query( { active: true, currentWindow: true }, (tabs) => {
		if (tabs.length > 0) {
			const currentTab = tabs[0];
			const id = currentTab.id;
			const queriedURL = currentTab.url

			if (queriedURL && queriedURL.includes(URL)) setExtensionStatus(true, id)
			else setExtensionStatus(false, id)
		}
	} )
}



//
// Main Flow of Execution
//




//
// Miscellaneous Event Listeners
//


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	queryChromeAPI(URL_PATTERN)
})



chrome.tabs.onActivated.addListener((activeInfo) => {
	queryChromeAPI(URL_PATTERN)
})



chrome.action.onClicked.addListener(() => {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		const currentTabID = tabs[0].id
		setExtensionStatus(false, currentTabID)
			chrome.tabs.sendMessage(tabs[0].id, { type: REQUESTS.CHAT })	
	})
})



chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message?.type === REQUESTS.ICON) {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			const currentTabID = tabs[0].id
			
			setExtensionStatus(true, currentTabID)
		})
	}
})



chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message?.type === REQUESTS.OPTIONS_MENU) {
		chrome.runtime.openOptionsPage()	
	}
})
