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
//NOTE TO DO: Fetch dữ liệu, Làm nút option, CRUD playlist, nhạc trong playlist
const USER_ID = 1;

const heading = $("header h2");
const nowPlayingList = $("header h4");
const dashBoard = $(".dashboard");
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
const playBtnLib = $(".btn-play-playLib");
const playLibContainer = $(".playLib-container");
const list = $$(".list");
const songAPI = "http://localhost:3000/songs";
const userAPI = "http://localhost:3000/users";
const playLibAPI = "http://localhost:3000/playLib";
var playedSong = [];

//Get DATA
const data = {
	async songData() {
		let data = await fetch(songAPI);
		let songs = await data.json();
		return songs;
	},
	async configData() {
		let data = await fetch(userAPI + "/" + USER_ID);
		let text = await data.json();
		return text;
	},
	async playLibData() {
		let data = await fetch(playLibAPI + "/" + USER_ID);
		let playLib = await data.json();
		return playLib;
	},
};

// APP
const app = {
	currentIndex: 0,
	playingList: 1,
	renderingList: 1,
	isPlaying: false,
	isRandom: false,
	isRepeat: false,
	lyrics: {},
	config: (await data.configData()).config,
	songs: await data.songData(),
	playLibs: (await data.playLibData()).list,
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
		Object.defineProperty(this, "renderingSongs", {
			//https://stackoverflow.com/questions/37502163/getter-setter-maximum-call-stack-size-exceeded-error
			get() {
				return this._renderingSongs;
			},
			set(value) {
				this._renderingSongs = value;
			},
		});
	},
	render(listIndex) {
		const list = this.playLibs.find((lib) => lib.id === listIndex);
		this.renderingSongs = list.songs;
		const htmls = this.renderingSongs.map((song, index) => {
			console.log("song", index, this.currentIndex);
			return `
            <div class="song ${
							index == this.currentIndex &&
							this.renderingList == this.playingList
								? "active"
								: ""
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
		const utilBar = `<div class="utilBar ${
			this.renderingList === this.playingList && this.isPlaying ? "playing" : ""
		}" data-index='${this.renderingList}'>
				<div class="btn btn-play util">
					<i class="fa-solid fa-play icon-play"></i>
					<i class="fas fa-pause icon-pause"></i>
				</div>
				<div class="title">${list.name}</div>
				<div class="btn btn-more">
					<i class="fa-solid fa-ellipsis-vertical"></i>
				</div>
			</div>
		`;
		htmls.unshift(utilBar);
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
			fetch(userAPI + "/" + USER_ID, {
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
				$(".song.active")?.scrollIntoView({
					behavior: "smooth",
					block: "center",
				});
			}, 300);
			_this.isPlaying = true;
			play.classList.add("playing");
			let playingLib = playLibContainer?.querySelector(".list.playing");
			let utilBar = playList.querySelector(".utilBar");
			playingLib?.classList.remove("playing");
			let currentList = Array.from(list).find((lst) => {
				return parseInt(lst.dataset.index) === _this.playingList;
			});
			if (_this.playingList === parseInt(utilBar.dataset.index)) {
				utilBar.classList.add("playing");
			}
			currentList?.classList.add("playing");
			cdAnimate.play();
		});
		audio.addEventListener("pause", function () {
			_this.isPlaying = false;
			play.classList.remove("playing");
			let playingLib = playLibContainer?.querySelector(".list.playing");
			let utilBar = playList?.querySelector(".utilBar.playing");
			playingLib?.classList.remove("playing");
			utilBar?.classList.remove("playing");
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
			const songNode = e.target.closest(".song");
			const optionNode = e.target.closest(".option");
			const songNodeActive = e.target.closest(".song.active");
			if (
				// Chuyển đến bài đó,// closest(): Trả về phần tử phù hợp đầu tiên tìm được (.song), đi từ phần tử hiện tại cho tới các phần tử tổ tiên, dừng lại ngay khi tìm đc
				songNode ||
				optionNode
			) {
				// Xử lí khi click vào song option
				if (optionNode) {
					e.stopPropagation();
					_this.showOption(optionNode);
				}
				// Xử lí khi click vào song
				else if (songNode) {
					if (songNodeActive) {
						if (_this.isPlaying) audio.pause();
						else audio.play();
					} else {
						_this.currentIndex = songNode.dataset.index;
						if (_this.renderingList === _this.playingList) {
							_this.loadCurrentSong();
						} else {
							_this.loadCurrentLib(_this.renderingList);
						}

						audio.play();
						console.log(
							_this.currentIndex,
							_this.renderingList,
							_this.playingList
						);
					}
				}
			}
		});
		// Xử lí khi click vào 1 List trong playLib:
		playLib.addEventListener("click", function (e) {
			const listNode = e.target.closest(".list");
			const playNode = e.target.closest(".btn-play-playLib");
			// Khi click vào nút play trong 1 list
			if (playNode) {
				let playingList = parseInt(playNode.closest(".list").dataset.index);
				// TH1: Khi list nhạc này đang chạy và trùng vs list nhạc được bấm nút
				if (_this.isPlaying && playingList === _this.playingList) {
					audio.pause();
				} //TH2: Khi list nhạc này đang dừng và trùng vs list nhạc được bấm nút
				else if (!_this.isPlaying && playingList === _this.playingList) {
					audio.play();
				} else {
					_this.loadCurrentLib(playingList);
					audio.play();
				}
			}
			// Khi click vào 1 list
			else if (listNode) {
				let index = parseInt(listNode.dataset.index);
				_this.renderingList = index;
				_this.render(index);
				homeBtn.click();
				console.log(_this.currentIndex, _this.renderingList, _this.playingList);
			}
		});
		// Xử lí khi click vào nút play trong Utility Bar
		playList.addEventListener("click", function (e) {
			let barIndex = parseInt(e.target.closest(".utilBar")?.dataset?.index);
			let playBtn = e.target.closest(".utilBar .btn");
			if (playBtn) {
				console.log(barIndex);
				if (_this.isPlaying && barIndex === _this.playingList) {
					audio.pause();
				} //TH2: Khi list nhạc này đang dừng và trùng vs list nhạc được bấm nút
				else if (!_this.isPlaying && barIndex === _this.playingList) {
					audio.play();
				} else {
					_this.loadCurrentLib(_this.renderingList);
					audio.play();
				}
			}
		});
		// Xử lí khi click vào 1 dòng lyrics
		lyrics.addEventListener("click", function (e) {
			audio.currentTime = e.target.dataset.index;
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
				screen.style.marginTop = this.style.getPropertyValue("--marginTop");
				dashBoard.style.display = this.style.getPropertyValue("--dashBoard");
			});
		});
	},
	// Xử lí bất đồng bộ (lyrics)
	handleAsync() {
		// Chỉ fetch những bài chưa có trong list
		if (!this.lyrics.hasOwnProperty(this.songs[this.currentIndex].lyrics)) {
			const loadLyrics = async () => {
				let data = await fetch(this.songs[this.currentIndex].lyrics);
				let text = await data.text();
				let arrText = text.split(".");
				let arrMap = arrText.map((line) => {
					return `<p class="" data-index='${line.trim().split(",")[1]}'>${
						line.trim().split(",")[0]
					}</p>`;
				});
				let lyric = arrMap.join("");
				lyrics.innerHTML = lyric;
				this.lyrics[this.songs[this.currentIndex].lyrics] = lyric;
			};
			loadLyrics();
		} else {
			lyrics.innerHTML = this.lyrics[this.songs[this.currentIndex].lyrics];
		}
	},
	loadCurrentLib(currentLib) {
		this.playingList = currentLib;
		let playingSongs = this.playLibs.find(
			(lib) => lib.id === this.playingList
		).songs;
		this.songs = playingSongs;
		if (this.playingList !== this.renderingList) {
			const activeSong = playList.querySelector(".song.active");
			activeSong?.classList.remove("active");
		}
		if (currentLib !== this.renderingList) {
			this.currentIndex = 0;
		}
		this.loadCurrentSong();
	},
	loadCurrentSong() {
		if (this.renderingList === this.playingList) {
			const activeSong = playList.querySelector(".song.active");
			const currentSongNode =
				playList.querySelectorAll(".song")[this.currentIndex];
			activeSong?.classList.remove("active");
			currentSongNode?.classList.add("active");
		}
		heading.textContent = this.currentSong.name;
		cdThumb.style.backgroundImage = `url('${this.currentSong.image}')`;
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
			$(".song.active")?.scrollIntoView({
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
                    <p>${this.renderingSongs[index].name}</p>
                    <h4>Singer</h4>
                    <p>${this.renderingSongs[index].singer}</p>
                </div>
            `;
	},
	start() {
		this.handleAsync();
		console.log(this.playLibs, this.renderingSongs, this.renderingList);
		// Gán cấu hình từ config vào App
		this.loadConfig();
		// Tạo thuộc tính cho App
		this.defineProperties();
		this.handleEvents();
		this.render(this.renderingList);
		this.loadCurrentSong();
	},
};
app.start();
