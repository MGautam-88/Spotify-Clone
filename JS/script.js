let currentSong = new Audio();
let songs = [];
let currFolder;

// Ensure the default state of the pause button starting main triangle
const pause = document.getElementById("pause");
pause.src = "./svgs/pause.svg"; // Default icon

function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    // Ensure seconds is a whole number
    seconds = Math.floor(seconds);

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

function attachSongListeners() {
    const songListItems = Array.from(document.querySelector(".songList ul").getElementsByTagName("li"));
    songListItems.forEach((li, index) => {
        li.addEventListener("click", () => {
            if (songs && songs[index]) {
                playMusic(songs[index].fullName); // Use the full name for playback
            } else {
                console.error(`Song at index ${index} is undefined.`);///////////////////isse hata kar log karna hai
            }
        });
    });
}


async function getSongs(folder, isDefault = false) {
    currFolder = folder;

    // Fetch the playlist data
    let response = await fetch(`http://127.0.0.1:5500/${folder}/`).then(res => res.text());
    let div = document.createElement("div");
    div.innerHTML = response;

    let as = div.getElementsByTagName("a");
    songs = []; // Reset the songs array before populating

    for (let i = 0; i < as.length; i++) {
        let e = as[i];
        if (e.href.endsWith(".mp3")) {
            let fullSongName = decodeURIComponent(e.href.split(`/${folder}/`)[1]);
            let firstTwoWords = fullSongName.split(".mp3")[0].split(" ").slice(0, 2).join(" ");
            songs.push({ fullName: fullSongName, trimmedName: firstTwoWords });
        }
    }

    // If this is the default playlist, set the first song as the default song
    if (isDefault && songs.length > 0) {
        // currentSong.src = `http://127.0.0.1:5500/${currFolder}/` + encodeURIComponent(songs[0].fullName);
        currentSong.src = `/${currFolder}/` + encodeURIComponent(songs[0].fullName);
        document.querySelector(".songinfo").innerHTML = songs[0].fullName; // Display the default song name
    }

    // Only update the song list visually without modifying the current song
    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = ""; // Clear the list first

    for (const song of songs) {
        songUL.innerHTML += `
            <li>
                <img src="./svgs/music.svg" alt=""> 
                <div class="info">
                    <div>${song.trimmedName}</div>
                    <div></div>
                </div>
                <div class="playnow">
                    <img class="invert" src="svgs/pause.svg" alt="">
                </div>
            </li>`;
    }

    // Attach click listeners for the updated song list
    attachSongListeners();

    return songs;
}


const playMusic = (track) => {
    // currentSong.src = `http://127.0.0.1:5500/${currFolder}/` + encodeURIComponent(track);
    currentSong.src = `/${currFolder}/` + encodeURIComponent(track);
    currentSong.play();
    pause.src = "./svgs/play.svg"; // Set to "play" icon when music starts || wala icon 

    document.querySelector(".songinfo").innerHTML = track;

    // Highlight the currently playing song in the song list
    const songListItems = Array.from(document.querySelector(".songList ul").getElementsByTagName("li"));
    songListItems.forEach((li) => li.classList.remove("playing")); // Remove 'playing' class from all songs

    songListItems.forEach((li) => {
        li.classList.remove("playing"); // Remove 'playing' class from all songs
        const playNowImage = li.querySelector(".playnow img");
        if (playNowImage) {
            playNowImage.style.opacity = '1'; // Reset opacity to 1 (original)
        }
    });

    const currentSongIndex = songs.findIndex(song => song.fullName === track);
    if (currentSongIndex !== -1) {
        songListItems[currentSongIndex].classList.add("playing"); // Add 'playing' class to the current song
    }

    // Change the opacity of the image inside the playnow div of the li
    const playNowImage = songListItems[currentSongIndex].querySelector(".playnow img");
    if (playNowImage) {
        playNowImage.style.opacity = '0'; // Set the desired opacity value
    }
};

async function displayAlbums() {
    let a = await fetch(`/songs/`)
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer")

    let array = Array.from(anchors);


    for (let index = 0; index < array.length; index++) {
        const e = array[index];

        if (e.href.includes("/songs/") && !e.href.includes(".htaccess")) {
            let folder = (e.href.split("/").slice(-1)[0]);
            //Get the metadata of the folder
            let a = await fetch(`/songs/${folder}/info.json`); //fetching the json file
            let response = await a.json();
            // console.log(response);
            cardContainer.innerHTML = cardContainer.innerHTML + `<div data-folder="${folder}" class="card">
                        <div class="play">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
                                fill="black">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                        <img src="/songs/${folder}/cover.jpg" alt="${response.Title}">
                        <h3>${response.Title}</h3>
                        <p>${response.Description}</p>
                    </div>`
        }
    }

    //Load the playlist whenever the card is clicked
    // Handle card clicks to load playlists
    Array.from(document.getElementsByClassName("card")).forEach((card) => {
        card.addEventListener("click", async (event) => {
            let folder = event.currentTarget.dataset.folder;

            // Clear the song list and reset songs
            document.querySelector(".songList ul").innerHTML = "";
            songs = [];

            // Fetch new songs
            await getSongs(`songs/${folder}`);
        });
    });

    //Play the first song of the album whenever the play btn on the card is clicked


}

async function main() {
    currentSong.volume = 0.5; // Set the default volume to 50%
    await getSongs("songs/Diljit", true);//Fetch the default playlist

    // playMusic(songs[0],true);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

    //Diisplay all albums on the page dynamically orr we can say using js
    displayAlbums();

    // Add event listener for the pause button
    pause.addEventListener("click", () => {
        if (currentSong.src === "") {
            pause.src = "./svgs/pause.svg"; // Reset to default if no song is playing matlab trianlge icon
            return;
        }

        if (currentSong.paused) {
            currentSong.play();
            pause.src = "./svgs/play.svg"; // Set to "play" icon
        } else {
            currentSong.pause();
            pause.src = "./svgs/pause.svg"; // Set to "pause" icon
        }
    });

    // Play the next song when the current song ends
    currentSong.addEventListener("ended", () => {
        let currentSongName = decodeURIComponent(currentSong.src.split("/").slice(-1)[0]);

        // Find the index of the current song in the songs array
        let currentIndex = songs.findIndex(song => song.fullName === currentSongName);
        let nextIndex = (currentIndex + 1) % songs.length; // Loop back to the first song if it's the last one

        playMusic(songs[nextIndex].fullName); // Play the next song
    });


    //Listen for Timeupdate event
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = ` ${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`;

        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%"; //here we have changes the css using js
    })

    //Add an event listener to the seekbar
    document.querySelector(".seekbar").addEventListener("click", (e) => {
        let percentage = (e.offsetX / e.target.getBoundingClientRect().width) * 100
        document.querySelector(".circle").style.left = percentage + "%";
        currentSong.currentTime = ((currentSong.duration) * percentage) / 100;
    })

    //Add an eventlistenmer for menu
    document.querySelector("#menu").addEventListener("click", () => {
        document.querySelector(".left").style.left = 0;
    })

    //Add an eventlistenmer for close
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-100%";
    })

    //Add event listener for previous and next buttons
    previous.addEventListener("click", () => {
        if (currentSong.currentTime > 0) {
            // Restart the current song if it has already started playing
            currentSong.currentTime = 0;
            // currentSong.play(); // Optional: Ensure the song continues playing
        } else {
            let currentSongName = decodeURIComponent(currentSong.src.split("/").slice(-1)[0]);

            // Find the index of the current song in the songs array
            let index = songs.findIndex(song => song.fullName === currentSongName);
            let prevIndex = (index - 1 + songs.length) % songs.length; // Loop back to the last if it's the first song
            playMusic(songs[prevIndex].fullName);
        }
    });

    //To ensure the previous button working
    previous.addEventListener("dblclick", () => {
        let currentSongName = decodeURIComponent(currentSong.src.split("/").slice(-1)[0]);

        // Find the index of the current song in the songs array
        let index = songs.findIndex(song => song.fullName === currentSongName);
        if ((index - 1) >= -1) {
            let prevIndex = (index - 1 + songs.length) % songs.length; // Loop back to the last if it's the first song
            playMusic(songs[prevIndex].fullName);
        }
    })

    next.addEventListener("click", () => {
        let currentSongName = decodeURIComponent(currentSong.src.split("/").slice(-1)[0]);

        // Find the index of the current song in the songs array
        let index = songs.findIndex(song => song.fullName === currentSongName);
        if ((index + 1) > length) {
            let nextIndex = (index + 1) % songs.length; // Loop back to the start if it's the last song
            playMusic(songs[nextIndex].fullName);
        }
    })

    //Add an event listener to the volume
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
    })

    // Change the volume icon
    document.querySelector(".volume img").addEventListener("click", () => {
        const img = document.querySelector(".volume img");
        if (img.src.includes("vol.svg")) {
            img.src = "./svgs/vold.svg"; // Change to the second icon
            currentSong.muted = true
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }

        else {
            img.src = "./svgs/vol.svg"; // Change back to the original icon
            currentSong.muted = false;
            document.querySelector(".range").getElementsByTagName("input")[0].value = currentSong.volume * 100;
        }
    });

    //Add an event listener for vol slider changes

}

////////////////////////////// Keyboard Shortcuts ///////////////////////////////////////
document.addEventListener("keydown", (event) => {
    // Handle spacebar to toggle play/pause
    if (event.code === "Space") {
        event.preventDefault(); // Prevent scrolling
        if (currentSong.src === "") {
            return;
        }
        if (currentSong.paused) {
            currentSong.play();
            pause.src = "./svgs/play.svg"; // Set to "play" icon
        } else {
            currentSong.pause();
            pause.src = "./svgs/pause.svg"; // Set to "pause" icon
        }
    }

    // Handle left and right arrow keys for seeking
    if (event.code === "ArrowRight" || event.code === "ArrowLeft") {
        event.preventDefault(); // Prevent default scrolling behavior
        if (currentSong.src === "") {
            return;
        }

        const seekStep = 5; // Adjust by 5 seconds
        if (event.code === "ArrowRight") {
            // Move forward
            currentSong.currentTime = Math.min(currentSong.currentTime + seekStep, currentSong.duration);
        } else if (event.code === "ArrowLeft") {
            // Move backward
            currentSong.currentTime = Math.max(currentSong.currentTime - seekStep, 0);
        }

        // Update seekbar and duration display
        updateSeekBarAndTime();
    }

    // Handle volume control with Arrow Up and Arrow Down
    if (event.code === "ArrowUp" || event.code === "ArrowDown") {
        event.preventDefault(); // Prevent default scrolling behavior
        let volumeStep = 0.1; // Volume change step (10%)

        if (event.code === "ArrowUp") {
            // Increase volume
            currentSong.volume = Math.min(currentSong.volume + volumeStep, 1); // Max volume is 1
        } else if (event.code === "ArrowDown") {
            // Decrease volume
            currentSong.volume = Math.max(currentSong.volume - volumeStep, 0); // Min volume is 0
        }


        // Update the volume slider
        const volumeInput = document.querySelector(".range input");
        if (volumeInput) {
            volumeInput.value = currentSong.volume * 100; // Update the slider position
        }
    }

    //For muting/unmuting the song using M key
    if (event.code === "KeyM") {
        const img = document.querySelector(".volume img");
        currentSong.muted = !currentSong.muted; // Toggle muted state

        if (currentSong.muted) {
            img.src = "./svgs/vold.svg"; // Change to muted icon
            document.querySelector(".range input").value = 0; // Set volume slider to 0
        } else {
            img.src = "./svgs/vol.svg"; // Change back to unmuted icon
            document.querySelector(".range input").value = currentSong.volume * 100; // Restore volume slider
        }
    }

    // Handle next song with Shift + N
    if (event.shiftKey && event.code === "KeyN") {
        let currentSongName = decodeURIComponent(currentSong.src.split("/").slice(-1)[0]);

        // Find the index of the current song in the songs array
        let index = songs.findIndex(song => song.fullName === currentSongName);
        let nextIndex = (index + 1) % songs.length; // Loop back to the start if it's the last song
        playMusic(songs[nextIndex].fullName);
    }

    // Handle previous song with Shift + P
    if (event.shiftKey && event.code === "KeyP") {
        let currentSongName = decodeURIComponent(currentSong.src.split("/").slice(-1)[0]);

        // Find the index of the current song in the songs array
        let index = songs.findIndex(song => song.fullName === currentSongName);
        let prevIndex = (index - 1 + songs.length) % songs.length; // Loop back to the last if it's the first song
        playMusic(songs[prevIndex].fullName);
    }
});

// Helper function to update the seekbar and current time display
function updateSeekBarAndTime() {
    const seekbar = document.querySelector(".circle");
    const timeDisplay = document.querySelector(".songtime");

    if (currentSong.duration) {
        seekbar.style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
        timeDisplay.innerHTML = `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`;
    }
}

main();
