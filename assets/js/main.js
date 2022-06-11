import { songs } from "./data.js";
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
 */
const PlAYER_STORAGE_KEY = "HAI DAO";

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
const playList = $(".playlist");
const modalOption = $(".modal-option");
const credits = $(".credits");
const modalCredit = $(".modal-credit");
var playedSong = [];

const app = {
	currentIndex: 0,
	isPlaying: false,
	isRandom: false,
	isRepeat: false,
	config: JSON.parse(localStorage.getItem(PlAYER_STORAGE_KEY)) || {},

	setConfig(key, value) {
		this.config[key] = value;
		localStorage.setItem(PlAYER_STORAGE_KEY, JSON.stringify(this.config));
	},
	loadConfig() {
		this.isRandom = this.config["isRandom"];
		this.isRepeat = this.config["isRepeat"];
	},
	defineProperties() {
		Object.defineProperty(this, "currentSong", {
			get() {
				return songs[this.currentIndex];
			},
		});
	},
	render() {
		const htmls = songs.map((song, index) => {
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
		// Khi tiến độ thay đổi
		function progressChange() {
			if (audio.duration) {
				progress.value = Math.floor((audio.currentTime / audio.duration) * 100);
			}
		}
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
	},
	loadCurrentSong() {
		const activeSong = playList.querySelector(".song.active");
		const currentSongNode =
			playList.querySelectorAll(".song")[this.currentIndex];

		heading.textContent = this.currentSong.name;
		cdThumb.style.backgroundImage = `url('${this.currentSong.image}')`;
		activeSong.classList.remove("active");
		currentSongNode.classList.add("active");
		audio.src = this.currentSong.path;
	},
	nextSong() {
		this.currentIndex++;
		if (this.currentIndex >= songs.length) {
			this.currentIndex = 0;
		}
		this.loadCurrentSong();
	},
	prevSong() {
		this.currentIndex--;
		if (this.currentIndex < 0) {
			this.currentIndex = songs.length - 1;
		}
		this.loadCurrentSong();
	},
	randomSong() {
		let newIndex;
		if (playedSong.length === songs.length) {
			playedSong = []; //prevent repeat played songs when random until all of them are played
		}
		do {
			newIndex = Math.floor(Math.random() * songs.length);
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
                    <p>${songs[index].name}</p>
                    <h4>Singer</h4>
                    <p>${songs[index].singer}</p>
                </div>
            `;
	},
	start() {
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
