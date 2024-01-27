import OpenAI from 'openai';

//
// Dicrionary for other scripts to use for handling error messages returned by util.js functions
//


export const NATIVE_ERROR_DICT = {
	INVALID_KEY: "invalid_api_key",
	GENERIC: "generic_error",
	NONEXISTENT: "key_not_found",
	API_LIMIT: "token_limit"

}


//
// Dictionary for handling inbound/outbound messaging
//


export const REQUESTS = {
	CHAT: "CHAT",			// for inbound and outbound chat operations
	ICON: "ICON",			// for inbound and outbound icon operations
	OPTIONS_MENU: "OPTIONS_MENU",	// for requesting the extensions options menu
} 


//
// Helper function that checks validity of user-entered key via a fetch request,
// then registers to chrome.storage API
//


export const registerAPIKey = async (key) => {
	const config = await getConfigurations() 

	const site = 'https://api.openai.com/v1/chat/completions'
	const options = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + key
			},
		body: JSON.stringify()
		}

	const response = await fetch(site, options)
	const data = await response.json()

	const target_msg = "We could not parse the JSON body of your request. (HINT: This likely means you aren't using your HTTP library correctly. The OpenAI API expects a JSON payload, but what was sent was not valid JSON. If you have trouble figuring out how to fix this, please contact us through our help center at help.openai.com.)"

	if (data?.error?.code === null && data?.error?.message == target_msg) {
		//success
		config.API_KEY = key
		config.KEYS_EXIST = true

		chrome.storage.sync.set({ "CONFIGURATIONS": config })

		return {
			successful: true,
			type: "success_msg",
			message: "Your API Key has been registered successfully!"
		} 

	} else if (data?.error?.code === 'invalid_api_key') {
		// failure
		return {
			successful: false,
			type: "invalid_api_key",
			message: data.error.code + "\n Please try again."
		}
	}  else {
		// failure... again...
		return {
			successful: false,
			type: "generic_error",
			message: "Something went wrong. Please try again" // this means we do not know wtf happened
		}
	}
}


//
// Helper function for checking if user API key entry exists in chrome.storage API
//


export const checkExistingKeys = async () => {
	const config = await getConfigurations()

	return new Promise((resolve) => {
		 
			if (!config?.KEYS_EXIST) {
				// failure
				resolve({
					successful: false,
					type: "key_not_found",
					message: "keys do not exist" 
				})
			} else {
				//success
				resolve({
					successful: true,
					type: "success_msg",
					message: null
				})
				
			}
		}
	)
}


//
// Function that handles openAI API chatCompletions requests	
//


export const fetchAPI = async (message, memory) => {
	let request;

	const tokenLimitErrSnippet = "maximum context length is 4097 tokens"
	const history = (memory === undefined) ? "\n\nno memory yet." : "\nMEMORY: \n" +  memory 
	const config = await getConfigurations()

	const openai = new OpenAI({
		// TODO: uncomment when done testing
		apiKey: config?.API_KEY,
		//organization: "org-rzh6ZyNdFySDvs3MCjifgpNH",
		dangerouslyAllowBrowser: true
	})

	const instructions = config.PROMPT
	const token = parseInt(config.TOKENS)

	// TODO: finish try block that will be used when API throws err
	// when msg size exceeds limit
	try {
		request = await openai.chat.completions.create({
			model: 'gpt-3.5-turbo',
			messages: [{ role: "system", content: instructions + history }, 
				{ role: "user", content: message }],
			max_tokens: token
		});

		

		return {
			successful: true,
			type: "payload",
			payload: {
				content: request["choices"][0]["message"]["content"],
				exit: request["choices"][0]["finish_reason"]
			}
			
		}

	} catch (error) {
		const string = error.toString()
		if (string.includes(tokenLimitErrSnippet)) {
			// TODO: add handling for when reaching API limit 
			return {
				successful: false,
				type: "token_limit",
				message: "API limit exceeded"
			}
		}
				
	}
}


//
// Function used for calling configuration object
//


export const getConfigurations = async () => {
	const CONF = "CONFIGURATIONS"
	const config = await new Promise(resolve => {
		chrome.storage.sync.get(CONF, item => {
			resolve(item[CONF])
		})
	})

	return config
}



//
//
//
