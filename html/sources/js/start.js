$(function () {

	$(".js-menuButton").on("click", function(e){
		$("html").toggleClass("side-menu-open");
	});

	$(".js-overlay-menu").on("click", function(e){
		if($(e.target).hasClass("js-overlay-menu")){
			$("html").toggleClass("overlay-menu-open");
		}	
	});

	$(".js-dropMobile").on("click", function(){
		var $this = $(this);
		$("[data-menu-drop='"+ $this.data("menu") +"']").toggleClass("dropMobile-open");
	});

	$(".js-closeDropMobile").on("click", function(){
		var $this = $(this);
		$this.closest(".new-ui-dropMobile-drop").removeClass("dropMobile-open");
	});

	$(".js-custom-select select").select2({
		minimumResultsForSearch: 500,
		width: "style"
	});

	$(".js-drop-select").on("click", function(){
		$(this).toggleClass("drop-open");
	});

	$(".js-selectList_item").on("click", function(e){
		var $this = $(this),
			$parent = $this.closest(".new-ui-selectList__main");
		if(!$this.hasClass("new-ui-selectList__main__item_selected")){
			$parent.find(".js-selectList_item").removeClass("new-ui-selectList__main__item_selected");
			$this.addClass("new-ui-selectList__main__item_selected");
		}
	});

	$(".js-flightSelect").on("click", function(){
		var $this = $(this);

		$this.toggleClass("new-flightSelect_open");
	});

	$(".js-tablet-filters").on("click", function(){
		$("html").toggleClass("nemo-root_asideShow");
	});

	$(".js-qtip").each(function() {
		$(this).qtip({
			content: {
				text: $(this).find('.tooltiptext')
			},
			position: {
				my: 'bottom right',  // Position my top left...
				at: 'top right', // at the bottom right of...	
				target: $(this).closest(".js-qtip")
			}
		});
	});

	$(".js-compareTable tr td").on("mouseenter", function(){
		var $this = $(this),
			$thisIndex = $this.index(),
			$closest = $this.closest("tr"),
			$closestIndex = $closest.index();

		$this.addClass("cellHover");
		for(i = 0; i < $thisIndex; i++){
			$closest.children(".new-compareTable-cell").eq(i).addClass("cells-hover");
		}
		for(j = 0; j < $closestIndex; j++){
			$closest.closest("table").find("tr").eq(j).children("td").eq($thisIndex).addClass("cells-hover");
		}
	});

	$(".js-compareTable tr td").on("mouseleave", function(){
		var $this = $(this),
			$thisIndex = $this.index(),
			$closest = $this.closest("tr"),
			$closestIndex = $closest.index();

		$this.removeClass("cellHover");
		for(i = 0; i < $thisIndex; i++){
			$closest.children(".new-compareTable-cell").eq(i).removeClass("cells-hover");
		}
		for(j = 0; j < $closestIndex; j++){
			$closest.closest("table").find("tr").eq(j).children("td").eq($thisIndex).removeClass("cells-hover");
		}
	});

});