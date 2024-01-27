import { fetchAPI, getConfigurations, NATIVE_ERROR_DICT, REQUESTS } from './util.js'


// Variable Inits
let BANNER_VISIBLE = false;
const MAX_CHAR_LENGTH = 15500


//
// Function that grabs all user visible text elements from
// the current webpage
//


const grabPageContents = () => {
	const body = document.body
	const elements = body.getElementsByTagName("*")
	const content = []

	for (const e of elements) {
		const tag = e.tagName.toLowerCase()
		if (tag == 'p' || tag == 'h1' ||
			tag == 'h2' || tag == 'h3' ||
			tag == 'h4' || tag == 'h5' ||
			tag == 'h6' || tag == 'a' ||
			tag == 'span' || tag == 'div')  {
			if (e.innerText != '') {
				content.push(e.innerText)
			}
		}
	}

	const filtered = content
		.filter(item => typeof item === 'string')
		.map(item => item.replace(/\n/g, ""));

	return filtered.join('')
};


//
// Function that generates HTML Banner that contains chatCompletions response
// which is then injected after response received
//



const injectOverlayElements = () => {
  const overlay = $('<div>')
    .attr('id', 'dimOverlay')
    .addClass("ask-genie")
    .css({
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0)', // Initial state: fully transparent
      transition: 'background-color 5s ease-in-out', // Fade-in transition
      zIndex: '9998', // Make sure the overlay is behind the banner
    });

  

  // Triggering a reflow to apply the initial style before transitioning
  void overlay.get(0).offsetWidth;

  // Set the background color to trigger the fade-in effect
  overlay.css('backgroundColor', 'rgba(0, 0, 0, 0.5)'); // Semi-transparent black

  const banner = $('<div>')
    .attr('id', 'chat-completions-banner')
    .addClass("ask-genie")
    .css({
      width: '100%',
      height: '0',	
      backgroundColor: '#333333',
      color: 'white',
      textAlign: 'center',
      position: 'fixed',
      top: '0', // Initially set top position above the viewport
      left: '0',
      zIndex: '9999',
      display: 'block',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      boxSizing: 'border-box',
      transition: 'height 0.5s ease-in-out',
      fontFamily: 'Helvetica',
      fontWeight: '100'
    })




  const bannerText = $('<div>')
    .attr('id', 'banner-text')
    .addClass("ask-genie")
    .css({
      color: 'white',
      width: '100%',
      height: 'auto'
    });

  const button = $('<button>')
    .attr('id', 'banner-button')
    .addClass("ask-genie")
    .text('Done')
    .css({
      marginTop: '10px',
      padding: '10px',
      cursor: 'pointer',
      display: 'none',
      marginLeft: 'auto',
      color: '#fff',
      backgroundColor: '#4CAF50'
    }).hover(()=>{
	$(this).css('background-color','#45a049')
    }, ()=>{
	$(this).css('background-color','4CAF50')
    }).on('click', ()=> {
	$(overlay).remove()
	$(banner).remove()

	chrome.runtime.sendMessage({ type: REQUESTS.ICON })
    })
    .hide();

  const progressBarText = $('<div>')
    .attr('id', 'progress-bar-text')
    .addClass("ask-genie")
    .css({
      opacity: '1',
    })
    .text('Loading...');

  const progressBar = $('<div>')
    .attr('id', 'progress-bar')
    .addClass("ask-genie")
    .css({
      width: '0%',
      height: '10px',
      backgroundColor: '#27ae60', // Green color for the progress bar
      transition: 'width 1s ease-in-out', // Fade-in and fade-out transition
    })
    .append(progressBarText);

  $(".ask-genie").css("font-family", "Helvetica")

  return {
    overlay: overlay.get(0),
    banner: banner.get(0),
    bannerText: bannerText.get(0),
    button: button.get(0),
    progressBar: progressBar.get(0),
    progressBarText: progressBarText.get(0)
  };
};




//
// Displays notifiction banner requiring API Key from user
//



const  apiKeyRequiredNotification =  () => {
	const message = $('<p>')
		.addClass('ask-genie')
		.html('An OpenAI API Key is required! Click here to activate this Extension!')

	const button = $('<button>').text("Options")
		.addClass('ask-genie')
		.css({
			"background-color": "white",
			"color": "black",
			"border": "2px solid black",
			"padding": "10px 20px",
			"font-size": "16px",
			"border-radius": "5px",
			"cursor": "pointer",
			"margin-left": "auto"
	}).on('click',  () => { chrome.runtime.sendMessage({ type: REQUESTS.OPTIONS_MENU }) }) 


	const notification = $('<div>')
		.attr('id', 'no-key-notification')
		.addClass('ask-genie')
		.css({
			width: '100%',
			height: 'auto',
			color: 'white',
			backgroundColor: 'red',
			padding: '15px',
			textAlign: 'center',
			zIndex: '9999',
			position: 'fixed',
			fontFamily: 'Helvetica',
			fontWeight: '100'
		}).append(message).append(button)

	$('body').prepend(notification)

	$(".ask-genie").css("font-family", "Helvetica")
	debugger
	setTimeout(()=>{
		$(notification).remove()
		chrome.runtime.sendMessage({ type: REQUESTS.ICON })
	}, 5000)
}



//
// Function that segments content data into chunks that can be passed individually
// to the API as to not break the token limits
//



const segmentContent = (content, decrementor = 0, singleMode=false) => {
	if (singleMode) {

		return content.slice(0, MAX_CHAR_LENGTH - decrementor)

	} else {
		const chunks = []
		for (let i = 0; i < content.length; i += MAX_CHAR_LENGTH - decrementor) {
			const buffer = content.slice(i, i + MAX_CHAR_LENGTH - decrementor)
			chunks.push(buffer)
		}

		return chunks
	}
}



// This will be the users way to interface with the extension when they request for chatCompletions
chrome.runtime.onMessage.addListener( async (message, sender, sendResponse) => {

	//FUNCTION
	const coreInitialize = async () => {
		const core = {}
		core.history = ''
		core.decrementor = 0
		core.config = await getConfigurations()
		core.content = grabPageContents()
		core.chunks = segmentContent(core.content)
		core.elements = injectOverlayElements()
		return core
	}


	//FUNCTION: aims to adjust payload message to fit API requirements recursively
	const rectifyAndRetry = async (core, chunk, history, decrementor) => {
		const size = chunk.length
		const newChunk = segmentContent(chunk, decrementor, true)
		const response = await fetchAPI(newChunk, history)
	
		if (!response?.successful && response.type === NATIVE_ERROR_DICT.API_LIMIT) {
			core.decrementor += 1000
			return await rectifyAndRetry(response, history, core.decrementor)

		} else {
			return response 
		}
	}


	//FUNCTION: aims to correct payload response
	const validateResults = async (core, obj, text) => {
		const prompt = `
			DEFINITIONS:
				OUTPUT = The end result text response that is generated
					from you, the AI model.

			TASK:
			Please review the following content and make sure that 
			your OUTPUT meets the following requirements:
				1) OUTPUT ends in complete sentence
				2) OUTPUT does not start with similar phrases to 
				 "Based on the content provided..."
				3) OUTPUT must begin as a declaritive sentence that is focused on the 
				 content subject matter.`
	
		if (text[text.length -1] !== '.') {
			console.log("API response failed to meet quality requirements. \n retrying completion...")
			const response = await fetchAPI(text, null, prompt)
			return await validateResults(core, response, response.payload.content)
		} else {
			return obj 
		}
	}




	//FUNCTION: Processes each chunk
	const chunkProcessor = async (core, chunks) => {
		let response;
	
		for (const chunk of chunks) {
			const count = chunks.indexOf(chunk)
	
			const progress = (count/chunks.length)*100
			core.elements.progressBar.style.width =  `${progress}%`
	
			response = await fetchAPI(chunk, core.history)
			if (!response.successful && response.type === NATIVE_ERROR_DICT.API_LIMIT) {
				console.log("API token limit exceeded.\n Decreasing payload size by ", core.decrementor+1000," characters...")
	
				response = await rectifyAndRetry(core, chunk, core.history, core.decrementor)
				core.history = response.payload.content
			} else {
				core.history = response.payload.content
			
			}
		
			console.log(count+1, " of ", chunks.length," completions generated.")
		}
		
		response = await validateResults(core, response, response.payload.content)
			

		return response;
	}



	// MAIN EXECUTION
	if (message?.type === "CHAT") {
		const core = await coreInitialize()

		if (core.config.KEYS_EXIST === true) {
			(async ()=> {
				const banner = core.elements.banner
				const bannerText = core.elements.bannerText
				const button = core.elements.button
				const overlay = core.elements.overlay
				const progressBar = core.elements.progressBar
				const progressBarText = core.elements.progressBarText
	
				$('body').append(overlay).prepend(banner)
				$(banner).animate({ "height": "50px" }, 1000, ()=> {
				$(banner).animate({ "padding": "15px" }, 1000)
    				})

				
				$(banner).append(progressBar)
	
				setTimeout(()=>{ progressBarText.style.opacity = '0'; },1000)
	
							
					//TODO: remove comment + new result code when finished testing jquery banner
				const results = await chunkProcessor(core, core.chunks)
					
					//TODO: revert back to commented code once done testing
				bannerText.innerText = results.payload.content
				$(progressBar).animate({ width: '0%' }, 1000, () => {
					$(banner).css('height', 'auto').append(bannerText).append(button)
					$(button).css({ display: 'block' }).fadeIn(1000)
				})
				
			} )()

		} else if (core.config.KEYS_EXIST === false) {
			apiKeyRequiredNotification()
		} else {}
	}
})


$(document).ready(() => {
	$('head').append('<p>This is a test</p>')
})
