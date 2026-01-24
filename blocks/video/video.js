export default function decorate(block) {
  /* change to ul, li */
  let videourl;
  let imgUrl;
  [...block.children].forEach((row) => {
    const link = row.querySelector('a');
    if (link) {
      videourl = link.href;
    }
    const img = row.querySelector('img');
    if (img) {
      imgUrl = img.src;
    }
  });
  const newDiv = document.createElement('div');
  newDiv.classList.add('video-content');
  const video = document.createElement('video');
  video.classList.add('autoplay-video');
  video.setAttribute('data-video-autoplay', 'true');
  const coverImg = document.createElement('img');
  coverImg.src = imgUrl;
  coverImg.classList.add('video-cover-image');
  video.id = 'myVideo';
  video.controls = true;
  video.width = 1120;
  video.preload = 'auto';
  const source = document.createElement('source');
  source.src = videourl;
  source.type = 'video/mp4';
  // 添加备用文本
  video.innerHTML = '';
  // 将source添加到video�?
  video.appendChild(source);
  newDiv.appendChild(video);

  newDiv.appendChild(coverImg);
  coverImg.addEventListener('click', () => {
    video.play();
    coverImg.style.display = 'none';
  });

  video.addEventListener('play', () => {
    // console.log('视频开始播�?);
  });

  block.replaceChildren(newDiv);
  const videoAutoplay = {
    init() {
      this.videos = document.querySelectorAll('[data-video-autoplay]');
      this.setupVideos();
      this.setupObserver();
      this.addVolumeControls();
    },

    setupVideos() {
      this.videos.forEach((v) => {
        v.muted = true;
        v.playsInline = true;
        v.preload = 'metadata';
        v.setAttribute('data-was-playing', 'false');
      });
    },

    setupObserver() {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const v = entry.target;
          if (entry.isIntersecting) {
            this.playVideo(v);
          } else {
            this.pauseVideo(v);
          }
        });
      }, { threshold: 0.3 });

      this.videos.forEach((v) => this.observer.observe(v));
    },

    async playVideo(v) {
      if (!v.paused) return;
      try {
        await v.play();
        coverImg.style.display = 'none';
        v.setAttribute('data-was-playing', 'true');
        coverImg.style.display = 'none';
      } catch (error) { /* empty */ }
    },

    pauseVideo(v) {
      coverImg.style.display = 'none';
      if (!v.paused) {
        v.setAttribute('data-was-playing', 'true');
        v.pause();
      } else {
        v.setAttribute('data-was-playing', 'false');
      }
    },

    addVolumeControls() {
      // 添加音量控制按钮�?..
    },
  };
  video.addEventListener('loadeddata', () => videoAutoplay.init());
  video.addEventListener('ended', () => {
    video.currentTime = 0;
    video.play();
  });
}
