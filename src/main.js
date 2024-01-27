import { registerAPIKey, checkExistingKeys, getConfigurations } from './util.js';

const API_KEY_CHAR_LIMIT = 60;
const TIME_BUFFER = 4000


//
//Main Flow of Execution
//


document.addEventListener("DOMContentLoaded", async () => {
	const config = await getConfigurations()

	const MAIN_MENU = {
		page: document.createElement("div"),
		title: document.createElement("h1"),
		content: document.createElement("div"),
		actions: {
			summarize: document.createElement("button")
		}
	}

	const FIRST_LAUNCH_PAGE = {
		page: document.createElement("div"),
		title: document.createElement("h1"),
		content: document.createElement("div"),
		actions: {
			key: document.createElement("textarea"),
			submit: document.createElement("button")
		}
	}

	// User will always be prompted with this page until key is 
	// Registered

	if (!config.KEYS_EXIST) {
		const status = buildFirstLaunchPage(FIRST_LAUNCH_PAGE)
			.then(() => {
				setTimeout(() => {
					FIRST_LAUNCH_PAGE.page.remove()
				},TIME_BUFFER)
			})
	}

	// buildLandingPage


	
})


//
// Builds FIRST_LAUNCH_PAGE object that prompts user for API key registration
//


const buildFirstLaunchPage = (conf) => {
	return new Promise((resolve) => {

		//build title key
		conf.title.innerHTML = "API Key Required!"

		//build content key
		const h3 = document.createElement("h3");
		h3.innerHTML = "Welcome! Thanks for supporting our work!"

		const p1 = document.createElement("p");
		p1.innerHTML = "You will need to register your OpenAI API Key for Summarizations to work."

		const p2 = document.createElement("p");
		p2.innerHTML = "Please enter your API Key:"

		const msgContainer = document.createElement("div");
		msgContainer.setAttribute("class", "error-container")


		const msg = document.createElement("h4");

		conf.content.setAttribute("class", "content-container");
		conf.content.appendChild(h3)
		conf.content.appendChild(p1)
		conf.content.appendChild(p2)
		conf.content.appendChild(msgContainer)


		//build actions.submit key
		conf.actions.submit.innerHTML = "Submit"
		conf.actions.submit.disabled = true
		conf.actions.submit.addEventListener("click", async () => {
			const response = await registerAPIKey(conf.actions.key.value)
			if (response.successful) {
				// success
				msg.style.color = 'green'
				msg.innerText = response.message.toString()
				msgContainer.appendChild(msg)
				resolve()
			} else {
				// failure
				msg.style.color = 'red'
				msg.innerText = response.message.toString()
				msgContainer.appendChild(msg)
				setTimeout(() => {
					msg.remove();
				}, 4000)
			}
		});
		



		//build actions.key key
		conf.actions.key.setAttribute('placeholder', 'Enter your API Key here')
		conf.actions.key.setAttribute('maxlength', API_KEY_CHAR_LIMIT)
		conf.actions.key.addEventListener('input', () => {
			conf.actions.submit.disabled = conf.actions.key.value.trim() === '';
		})


		//build page key
		conf.page.setAttribute("class", "first-launch-container")
		conf.page.appendChild(conf.title)
		conf.page.appendChild(conf.content)
		conf.page.appendChild(conf.actions.key)
		conf.page.appendChild(conf.actions.submit)
		
		document.body.appendChild(conf.page)
		})
}


//
// Builds the MAIN_MENU object which will serve as the landing page
//


const buildMainMenu = (conf) => {
	return new Promise((resolve) => {
		
		//build title key
		conf.title.innerText = "Let's Summarize!"

		//build content key
		const p1 = document.createElement("p")
		p1.innerText = "Click here to "

	})
}


