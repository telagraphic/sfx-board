This is a simple soundboard that allows you to play sounds by clicking on the buttons.

I want to know if I can add the following functionality:

1. From the index.html, click a button to that opens a modal that asks for url of youtube vide.
2. Use a package to download the audio from the youtube video and store it locally in the browser, or server (Bunny.net) or on the users computer if those two options are not possible.
3. Take that downloaded audio file and provide a simple UI to trim the audio file. This should have have playblack scroller and an in and out point to make it visually easy
4. When the user is done trimming the audio, I want to name it and save it to the soundboard. Saving should upload it to the server and then return the url to the audio file.


Provide a possible solution to this. I don't need code, I want to know if this is possible and how to do it.

For point 2:

What type of server would I need for the ytdl-core work with? I will be hosting this on netlify.
I want to use Bun for this project.

For point 3:

Using peaks.js would be ideal.

For point 4:

I want to host the final audio file on Bunny.net.
When the trimmed audio file is saved, I will also need to delete the original audio file from the server.
