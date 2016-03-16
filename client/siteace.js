Websites = new Mongo.Collection("websites");

Router.configure({
	layoutTemplate: 'ApplicationLayout'
});

Router.route('/', function(){
	this.render('navabar_template', {
		to: "navbar"
	});
	this.render('websites_main',{
		to: "main"
	});
});

Router.route('/website/:_id', function () {
	this.render('navabar_template', {
		to: "navbar"
	});
	this.render('website_item_with_comments', {
		to: "main",
		data: function() {
			return Websites.findOne({_id: this.params._id});
		}
	});
});

Router.route('/recommendations', function(){
	this.render('navabar_template', {
		to: "navbar"
	});
	this.render('recommended_websites',{
		to: "main"
	});
});

if (Meteor.isClient) {

	Accounts.ui.config({
		passwordSignupFields: "USERNAME_AND_EMAIL"
	});

	/////
	// template helpers
	/////
	Template.body.helpers({
		isLoggedIn: function(){
			//console.log(Meteor.user());
			if(Meteor.user()) {
				return true;
			} else {
				return false;
			}
		}
	});

	Template.navabar_template.events({
		'click .instruction-button': function(event){
			$("#instructions_dialog").modal("show");
		},
		'click .nav-item': function(event){
			$(".nav").find(".active").removeClass("active");
			$(event.target).parent().addClass("active");
		}
	})

	Template.registerHelper("prettifyDate", function(timestamp) {
		var options = {
		    weekday: "long", year: "numeric", month: "short",
		    day: "numeric", hour: "2-digit", minute: "2-digit"
		};
		return new Date(timestamp).toLocaleTimeString("en-us", options);
	});

	// helper function that returns all available websites
	Template.website_list.helpers({
		websites:function(){
			var searchText = Session.get("filter")
			if( searchText != "" && searchText != undefined) {
				websites = Websites.find().fetch().
				filter(function (doc) {
					var title = doc.title.toLowerCase();
					if(title.startsWith(searchText))
						return doc
				});

				return websites;
			} else {
				return Websites.find({},{sort:{upVotes: -1}});
			}
		}
	});

	Template.website_list.events({
		"keyup .search_site": function(event){
			console.log(event.target.value);
			searchText = event.target.value.trim().toLowerCase();
			if(searchText != "") {
				Session.set("filter", searchText);
			} else {
				Session.set("filter", "");
			}
		},
		"click .search_clear": function(event) {
			Session.set("filter", "");
			$("#search_site").val("");
		}
	});


	/////
	// template events
	/////

	var websiteHelpers = {
		isLoggedIn: function(){
			//console.log(Meteor.user());
			if(Meteor.user()) {
				return true;
			} else {
				return false;
			}
		},
		getUser: function(user_id){
			var user = Meteor.users.findOne({_id:user_id});
			if (user){
				return user.username;
			}
			else {
				return "unknown";
			}
		}
	};

	Template.website_item.helpers(websiteHelpers);
	Template.website_item_with_comments.helpers(websiteHelpers);

		var upDownEvents = {
			"click .js-upvote":function(event){
			// example of how you can access the id for the website in the database
			// (this is the data context for the template)
			var website_id = this._id;
			//console.log("Up voting website with id "+website_id);
			// put the code in here to add a vote to a website!

			var website = Websites.findOne({_id:website_id});
			var upVotes = 0;
			if(website.upVotes != undefined)
				upVotes = website.upVotes;

			Session.set("lastUpvotedSite", website_id);
			Websites.update({_id:website_id},
										{$set: {upVotes: upVotes + 1}});

			return false;// prevent the button from reloading the page
		},
		"click .js-downvote":function(event){

			// example of how you can access the id for the website in the database
			// (this is the data context for the template)
			var website_id = this._id;
			//console.log("Down voting website with id "+website_id);

			// put the code in here to remove a vote from a website!

			var website = Websites.findOne({_id:website_id});
			var downVotes = 0;
			if(website.downVotes != undefined)
				downVotes = website.downVotes;

			Websites.update({_id:website_id},
										{$set: {downVotes:downVotes+1}});

			return false;// prevent the button from reloading the page
		}
	}

	Template.website_item.events(upDownEvents);
	Template.website_item_with_comments.events(upDownEvents);

	Template.website_form.helpers({
		isLoggedIn: function(){
			//console.log(Meteor.user());
			if(Meteor.user()) {
				return true;
			} else {
				return false;
			}
		},
		isFetchingInfo: function() {
			return Session.get("fetching_info_inprogress");
		},
		showUrlMessage: function() {
			return Session.get("show_url_msg");
		}
	});

	Template.website_form.events({
		"click .js-toggle-website-form":function(event){
			$("#website_form").toggle('slow');
		},
		"keyup #url":function(event){
			var url = event.target.value;
			if(url.trim() != "") {
				if(url.startsWith("http://") || url.startsWith("https://"))
				{
					Session.set("show_url_msg", false);
					Session.set("fetching_info_inprogress", true);
					extractMeta(url, function(err, res){
						if (!err) {
							console.log(res);
							$("#title").val(res.title);
							$("#description").val(res.description);
						} else {

						}
						Session.set("fetching_info_inprogress", false);
					});
				}
				else {
					Session.set("show_url_msg", true);
				}
			}
		},
		"submit .js-save-website-form":function(event){
			// here is an example of how to get the url out of the form:
			var target = event.target;
			var url = target.url.value;
			var title = target.title.value;
			var description = target.description.value
			//console.log("The url they entered is: "+url);

			if(url.trim() === "" ||
				title.trim() === "") {
					Session.set("message","Please input URL and Title.");
					$("#msg_dialog").modal("show");
			} else {
					Websites.insert({
						title: title,
						url: url,
						description: description,
						upVotes: 0,
						downVotes: 0,
						createdOn:new Date(),
            createdBy:Meteor.user()._id
					});

					$(target.url).val("");
					$(target.title).val("");
					$(target.description).val("");

					$("#website_form").toggle('slow');

					Session.set("message","Site added.");
					$("#msg_dialog").modal("show");
			}
			return false;// stop the form submit from reloading the page

		}
	});

	Template.comment_form.helpers({
		isLoggedIn: function(){
			//console.log(Meteor.user());
			if(Meteor.user()) {
				return true;
			} else {
				return false;
			}
		}
	});

	Template.comment_form.events({
		"submit .js-comment-form":function(event){
			var website_id = this.websiteid;
			var target = event.target;
			var comment = target.comment.value;
			$(event.target.comment).val("");


			Websites.update({_id:website_id},
											{$addToSet: {
												"comments":
												{
													comment: comment,
													createdOn:new Date(),
					            		createdBy:Meteor.user()._id
												}
											}}
			);

			return false;// stop the form submit from reloading the page

		}
	});

	Template.msg_dialog.helpers({
			getMessage: function() {
				return Session.get("message");
			}
	});

	Template.instructions_dialog.helpers({
		getInstructions: function() {
			return [
				{"instruction":`Users can register and login using 'Sign in' link.`},
				{"instruction":`Users can post new websites if they are logged in. Websites posted by users should have an URL and a description.`},
				{"instruction":`Users can up and down vote webpages by clicking a up or a down button. Only if they are logged in.`},
				{"instruction":`Websites should be listed with the most up voted site first. Considering only up votes - not difference between up and down votes.`},
				{"instruction":`The listing page shows when the website was added and how many up and down votes it has.`},
				{"instruction":`Users can move to a detail page for a website (using routing).`},
				{"instruction":`On the detail page, users can post comments about a webpage, and they are displayed below the description of the webpage.`},
				{"instruction":`Challenge 1: Automatic information - When you type URL in input it will automatically get the information about site if found. See message for url`},
				{"instruction":`Challenge 2: Search function - Search will look for Site starting with search text - case incensitive. Use clear button or delete input text to go back to all list`},
				{"instruction":`Challenge 3: Website recommender - Up vote one of the site with receipie and recommended sites will be displayes with match`}
			];
		}
	});

	Template.recommended_websites.helpers({
		lastUpVotedWebsite : function() {
			var website_id = Session.get("lastUpvotedSite");
			if(website_id == "" || website_id == undefined)
			{
				return false;
			}
			else {
				website = Websites.findOne({_id:website_id});
				return website.title;
			}
		},
		recommended_websites:function(){
			var website_id = Session.get("lastUpvotedSite");
			if(website_id == "" || website_id == undefined)
			{
				return false;
			}
			else {
				website = Websites.findOne({_id:website_id});
				upVotedTitle = website.title;
				var searchText = upVotedTitle.split(" ");
				websites = Websites.find({},{sort:{upVotes: -1}}).fetch().
				filter(function (doc) {
					var title = doc.title.toLowerCase();
					if(website._id !== doc._id) {
						for(i=0; i<searchText.length; i++) {
							var regex = new RegExp('\\b' + searchText[i].toLowerCase() + '\\b');
							if(title.search(regex) != -1) {
								return doc;
							}
						}
					}
				});
				return websites;
			}
		}
	});
}
