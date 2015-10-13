define(
	['js/lib/mobile.detect.js/mobileDetect'],
	function (MobileDetect) {
		function mobileDetect(userAgent) {
			if (typeof userAgent == 'undefined'){
				userAgent = navigator.userAgent
			}
			var libParseResult = new MobileDetect(userAgent);
			var screenRatio = window.devicePixelRatio || parseFloat(window.screen.availWidth / document.documentElement.clientWidth).toFixed(2) || 1,
				screenWidth = window.innerWidth * screenRatio,
				screenHeight = window.innerHeight * screenRatio,
				screenOrientation = screenWidth > screenHeight ? 'portrait' : 'landscape';
			this.res = {
				ratio : screenRatio ,
				screenWidth: screenWidth,
				screenHeight: screenHeight,
				deviceType:'',
				deviceName:'',
				screenOrientation:screenOrientation
			};
			if(libParseResult.phone() != null){
				this.res.deviceType = 'phone';
				this.res.deviceName = libParseResult.phone();

			}else if(libParseResult.tablet() != null){
				this.res.deviceType = 'tablet';
				this.res.deviceName = libParseResult.tablet();
			}
			else if(libParseResult.mobile() == null){
				this.res.deviceType = 'desktop';
			}else{
				if(screenWidth >= 320 && screenWidth <= 480 && screenRatio >= 1
					||screenWidth >= 320 && screenWidth <= 568 && screenRatio >= 1
					||screenWidth >= 375 && screenWidth <= 667 && screenRatio >= 1
					||screenWidth >= 414 && screenWidth <= 736 && screenRatio >= 2
					||screenWidth >= 320 && screenWidth <= 640 && screenRatio >= 1
					||screenWidth >= 360 && screenWidth <= 640 && screenRatio >= 1
				){
					this.res.deviceType = 'phone';
				}
				else if(screenWidth >= 768 && screenWidth <= 1024 && screenRatio == 1
					||screenWidth >= 800 && screenWidth <= 1280 && screenRatio == 1
					||screenWidth >= 601 && screenWidth <= 906 && screenRatio >= 1
					||screenWidth >= 800 && screenWidth <= 1280 && screenRatio >= 1
					||screenWidth >= 1200 && screenWidth <= 1600 && screenRatio >= 1
				){
					this.res.deviceType = 'tablet';
				}
				else if(screenWidth >= 1200 && screenWidth <= 1600  && screenRatio == 2){
					this.res.deviceType = 'retina';
				}else{
					this.res.deviceType = 'desktop';
				}
			}
			return this.res;
		};
		return mobileDetect
	}
);