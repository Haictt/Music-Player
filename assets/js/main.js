const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);
/*
 * 1. Render playlist
 * 2. Scroll top
 * 3. Play / Pause / Seek
 * 4. CD rotate
 * 5. Next / Prev
 * 6. Random
 * 7. Next / Repeat when end
 * 8. Acitive Song
 * 9. Scroll song when in to view
 * 10. Play song when click
 * 11. Lyrics
 */
//NOTE TO DO: THAY ĐỔI THUẬT TOÁN CHUYỂN DÒNG
const USER_ID = 1;

const heading = $("header h2");
const cdThumb = $(".cd-thumb");
const audio = $("#audio");
const cd = $(".cd");
const playBtn = $(".btn-toggle-play");
const play = $(".player");
const progress = $('input[type="range"]');
const nextBtn = $(".btn-next");
const prevBtn = $(".btn-prev");
const randomBtn = $(".btn-random");
const repeatBtn = $(".btn-repeat");
const modalOption = $(".modal-option");
const credits = $(".credits");
const modalCredit = $(".modal-credit");
const screen = $(".screen");
const playList = $(".playlist");
const lyrics = $(".lyrics");
const playLib = $(".playLib");
const nav = $(".nav-bar");
const homeBtn = $(".btn-home");
const lyricsBtn = $(".btn-lyrics");
const playLibBtn = $(".btn-playLib");
const songAPI = "http://localhost:3000/songs";
const configAPI = "http://localhost:3000/configs";
var playedSong = [];

//Get DATA
const songData = async () => {
	let data = await fetch(songAPI);
	let songs = await data.json();
	return songs;
};
const configData = async () => {
	let data = await fetch(configAPI + "/" + USER_ID);
	let text = await data.json();
	return text;
};

// APP
const app = {
	currentIndex: 0,
	isPlaying: false,
	isRandom: false,
	isRepeat: false,
	config: (await configData()).config,
	songs: await songData(),

	setConfig(key, value) {
		this.config[key] = value;
	},
	loadConfig() {
		this.isRandom = this.config["isRandom"];
		this.isRepeat = this.config["isRepeat"];
	},
	defineProperties() {
		Object.defineProperty(this, "currentSong", {
			get() {
				return this.songs[this.currentIndex];
			},
		});
	},
	render() {
		const htmls = this.songs.map((song, index) => {
			return `
            <div class="song ${
							index === this.currentIndex ? "active" : ""
						}" data-index = "${index}">
                <div
                    class="thumb"
                    style="
                        background-image: url('${song.image}');"
                ></div>
                <div class="body">
                    <h3 class="title">${song.name}</h3>
                    <p class="author">${song.singer}</p>
                </div>
                <div class="option" data-index = "${index}">
                    <i class="fas fa-ellipsis-h"></i>
                </div>
            </div>
        `;
		});
		playList.innerHTML = htmls.join("");
		//Render config
		randomBtn.classList.toggle("active", this.isRandom);
		repeatBtn.classList.toggle("active", this.isRepeat);
	},
	handleEvents() {
		const _this = this;
		const navBtn = [homeBtn, lyricsBtn, playLibBtn];
		const screens = [playList, lyrics, playLib];
		const cdWidth = cd.offsetWidth;
		//Xử lí CD quay, dừng
		const cdAnimate = cdThumb.animate(
			[
				//Keyframes
				{
					transform: "rotate(360deg)",
				},
			],
			{
				//Timing options
				duration: 10000,
				iterations: Infinity,
			}
		);
		cdAnimate.pause();
		// Xử lí phóng to, thu nhỏ thumb
		document.addEventListener("scroll", function () {
			const scrollTop = window.scrollY || document.documentElement.scrollTop;
			const newCdWidth = cdWidth - scrollTop;

			cd.style.width = newCdWidth > 0 ? newCdWidth + "px" : 0; //Prevent cd width can't access its width properly when fast scrolling
		});
		// Upload config trước khi reload page
		addEventListener("beforeunload", () => {
			fetch(configAPI + "/" + USER_ID, {
				method: "PATCH",
				body: JSON.stringify({
					config: {
						isRandom: this.isRandom,
						isRepeat: this.isRepeat,
					},
				}),
				headers: {
					"Content-Type": "application/json",
				},
			});
		});
		// Xử lí nút play
		playBtn.addEventListener("click", function () {
			if (_this.isPlaying) {
				audio.pause();
			} else {
				audio.play();
			}
		});
		// Xử lí nút next
		nextBtn.addEventListener("click", function () {
			if (_this.isRandom) {
				_this.randomSong();
			} else {
				_this.nextSong();
			}
			_this.scrollToActiveSong();
			audio.play();
		});
		// Xử lí nút prev
		prevBtn.addEventListener("click", function () {
			if (_this.isRandom) {
				_this.randomSong();
			} else {
				_this.prevSong();
			}
			_this.scrollToActiveSong();
			audio.play();
		});
		// Xử lí nút random
		randomBtn.addEventListener("click", function () {
			playedSong = [];
			_this.isRandom = !_this.isRandom;
			_this.setConfig("isRandom", _this.isRandom);
			this.classList.toggle("active", _this.isRandom);
		});
		// Xử lí nút repeat
		repeatBtn.addEventListener("click", function () {
			_this.isRepeat = !_this.isRepeat;
			_this.setConfig("isRepeat", _this.isRepeat);
			this.classList.toggle("active", _this.isRepeat);
		});
		// Khi song được play, pause
		audio.addEventListener("play", function () {
			setTimeout(() => {
				$(".song.active").scrollIntoView({
					behavior: "smooth",
					block: "center",
				});
			}, 300);
			_this.isPlaying = true;
			play.classList.add("playing");
			cdAnimate.play();
		});
		audio.addEventListener("pause", function () {
			_this.isPlaying = false;
			play.classList.remove("playing");
			cdAnimate.pause();
		});
		// Thuật toán tìm dòng gần nhất với thời gian hiện tại trong lyrics
		function prevTimeStamp() {
			const lines = lyrics.querySelectorAll("p");
			const length = lines.length;
			for (let i = length - 1; i >= 0; i--) {
				if (lines[i].dataset.index <= audio.currentTime) {
					if (!lines[i].classList.contains("active")) {
						lyrics?.querySelector("p.active")?.classList.remove("active");
						lines[i].classList.add("active");
						_this.scrollToActiveLine();
					}
					break;
				}
			}
		}
		// Thay đổi vị trí thanh progress
		function progressChange() {
			if (audio.duration) {
				progress.value = Math.floor((audio.currentTime / audio.duration) * 100);
				prevTimeStamp();
			}
		}
		// Khi tiến độ thay đổi
		audio.addEventListener("timeupdate", progressChange);
		// Khi tua xong
		progress.addEventListener("change", function () {
			audio.addEventListener("timeupdate", progressChange);
			const seekTime = Math.floor((this.value / 100) * audio.duration);
			audio.currentTime = seekTime;
		});
		// Khi đang tua: Ngăn thanh progress tiếp tục chạy khi giữ thanh
		progress.addEventListener("input", function () {
			audio.removeEventListener("timeupdate", progressChange);
		});
		// Xử lí next song khi audio ended
		audio.addEventListener("ended", function () {
			if (_this.isRepeat) {
				audio.play();
			} else {
				nextBtn.click();
			}
		});
		// Xử lí khi click vào song:
		playList.addEventListener("click", function (e) {
			const songNode = e.target.closest(".song:not(.active)");
			const optionNode = e.target.closest(".option");
			if (
				// Chuyển đến bài đó,// closest(): Trả về phần tử phù hợp đầu tiên tìm được (.song), đi từ phần tử hiện tại cho tới các phần tử tổ tiên, dừng lại ngay khi tìm đc
				songNode ||
				optionNode
			) {
				// Xử lí khi click vào song
				if (optionNode) {
					e.stopPropagation();
					_this.showOption(optionNode);
				}
				// Xử lí khi click vào song option
				else if (songNode) {
					_this.currentIndex = songNode.dataset.index;
					_this.loadCurrentSong();
					audio.play();
				}
			}
		});
		// Xử lí khi click vào 1 dòng lyrics
		lyrics.addEventListener("click", function (e) {
			if (_this.isPlaying) {
				audio.currentTime = e.target.dataset.index;
			}
		});
		// Xử lí khi click vào credits
		credits.addEventListener("click", function (e) {
			console.log(modalCredit);
			e.stopPropagation();
			_this.showCredits();
			modalCredit
				.querySelector(".modal-container")
				.addEventListener("click", function (e) {
					e.stopPropagation();
				});
		});

		// Xử lí khi click ra ngoài thì loại bỏ modal option
		document.addEventListener("click", function () {
			modalOption.style.display = "none";
			modalOption.removeAttribute("data-index");
			modalCredit.style.display = "none";
		});
		// Xử lí khi bấm nút ở nav-bar
		navBtn.forEach(function (btn, index) {
			btn.addEventListener("click", function () {
				const activeBtn = nav.querySelector(".btn.active");
				const activeScreen = screen.querySelector(".scr.active");
				activeBtn.classList.remove("active");
				activeScreen.classList.remove("active");
				activeScreen.style.display = "none";
				this.classList.add("active");
				screens[index].classList.add("active");
				screens[index].style.display = "block";
			});
		});
	},
	// Xử lí bất đồng bộ (lyrics)
	handleAsync() {
		const loadLyrics = async () => {
			let data = await fetch(this.songs[this.currentIndex].lyrics);
			let text = await data.text();
			let arrText = text.split(".");
			let arrMap = arrText.map((line) => {
				return `<p class="" data-index='${line.trim().split(",")[1]}'>${
					line.trim().split(",")[0]
				}</p>`;
			});
			lyrics.innerHTML = arrMap.join("");
		};
		loadLyrics();
	},
	loadCurrentSong() {
		const activeSong = playList.querySelector(".song.active");
		const currentSongNode =
			playList.querySelectorAll(".song")[this.currentIndex];

		heading.textContent = this.currentSong.name;
		cdThumb.style.backgroundImage = `url('${this.currentSong.image}')`;
		activeSong.classList.remove("active");
		currentSongNode.classList.add("active");
		this.handleAsync();
		audio.src = this.currentSong.path;
	},
	nextSong() {
		this.currentIndex++;
		if (this.currentIndex >= this.songs.length) {
			this.currentIndex = 0;
		}
		this.loadCurrentSong();
	},
	prevSong() {
		this.currentIndex--;
		if (this.currentIndex < 0) {
			this.currentIndex = this.songs.length - 1;
		}
		this.loadCurrentSong();
	},
	randomSong() {
		let newIndex;
		if (playedSong.length === this.songs.length) {
			playedSong = []; //prevent repeat played songs when random until all of them are played
		}
		do {
			newIndex = Math.floor(Math.random() * this.songs.length);
		} while (this.currentIndex === newIndex || playedSong.includes(newIndex));
		this.currentIndex = newIndex;
		playedSong.push(this.currentIndex);
		this.loadCurrentSong();
	},
	scrollToActiveSong() {
		setTimeout(() => {
			$(".song.active").scrollIntoView({
				behavior: "smooth",
				block: "center",
			});
		}, 300);
	},
	scrollToActiveLine() {
		setTimeout(() => {
			lyrics.querySelector("p.active").scrollIntoView({
				behavior: "smooth",
				block: "center",
			});
		}, 10);
	},
	showOption(node) {
		modalOption.setAttribute("data-index", `${node.dataset.index}`);
		modalOption.style.display = "block";
		if (window.innerHeight / 2 > node.offsetTop) {
			modalOption.style.left = node.offsetLeft + 10 + "px";
			modalOption.style.top =
				node.offsetTop + modalOption.offsetHeight / 2 - 16 + "px";
		} else if (window.innerHeight / 2 <= node.offsetTop) {
			modalOption.style.left = node.offsetLeft + 10 + "px";
			modalOption.style.top =
				node.offsetTop - modalOption.offsetHeight + 16 + "px";
		}
	},
	showCredits() {
		const index = modalOption.dataset.index;
		modalOption.style.display = "none";
		modalCredit.style.display = "flex";
		modalCredit.innerHTML = `
                <div class="modal-container">
                    <h3>CREDITS</h3>
                    <h4>Song Name</h4>
                    <p>${this.songs[index].name}</p>
                    <h4>Singer</h4>
                    <p>${this.songs[index].singer}</p>
                </div>
            `;
	},
	start() {
		this.handleAsync();
		// Gán cấu hình từ config vào App
		this.loadConfig();
		// Tạo thuộc tính cho App
		this.defineProperties();
		this.handleEvents();
		this.render();
		this.loadCurrentSong();
	},
};
app.start();
