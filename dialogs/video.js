CKEDITOR.dialog.add('video', function(editor)
{
	function commitValue(videoNode, extraStyles)
	{
		var value = this.getValue();

		videoNode.setAttribute(this.id, value);

		if (!value) {
			return;
		}

		switch (this.id)
		{
			case 'poster':
				extraStyles.backgroundImage = 'url(' + value + ')';
				break;
			case 'width':
				extraStyles.width = value + 'px';
				break;
			case 'height':
				extraStyles.height = value + 'px';
				break;
		}
	}

	function commitSrc(videoNode, extraStyles, videos)
	{
		var match = this.id.match(/(\w+)(\d)/),
			id = match[1],
			number = parseInt(match[2], 10);

		var video = videos[number] || (videos[number] = {});
		video[id] = this.getValue();
	}

	function loadValue(videoNode)
	{
		if (videoNode) {
			this.setValue(videoNode.getAttribute(this.id));
		}
	}

	function loadSrc(videoNode, videos)
	{
		var match = this.id.match(/(\w+)(\d)/),
			id = match[1],
			number = parseInt(match[2], 10);

		var video = videos[number];
		if (!video) {
			return;
		}
		this.setValue(video[id]);
	}

	// // To automatically get the dimensions of the poster image
	// var onImgLoadEvent = function()	{
	// 	// Image is ready.
	// 	var preview = this.previewImage;
	// 	preview.removeListener('load', onImgLoadEvent);
	// 	preview.removeListener('error', onImgLoadErrorEvent);
	// 	preview.removeListener('abort', onImgLoadErrorEvent);
	// 	// 	this.setValueOf('info', 'width', preview.$.width);
	// 	// 	this.setValueOf('info', 'height', preview.$.height);
	// };
    //
	// var onImgLoadErrorEvent = function() {
	// 	// Error. Image is not loaded.
	// 	var preview = this.previewImage;
	// 	preview.removeListener('load', onImgLoadEvent);
	// 	preview.removeListener('error', onImgLoadErrorEvent);
	// 	preview.removeListener('abort', onImgLoadErrorEvent);
	// };

	return {
		title: editor.lang.video.dialogTitle,
		minWidth: 500,
		minHeight: 120,
		onShow: function() {
			// Clear previously saved elements.
			this.fakeImage = this.videoNode = null;
			// To get dimensions of poster image
			this.previewImage = editor.document.createElement('img');
			var fakeImage = this.getSelectedElement();
			if (fakeImage && fakeImage.data('cke-real-element-type') && fakeImage.data('cke-real-element-type') == 'video') {
				this.fakeImage = fakeImage;
				var videoNode = editor.restoreRealElement(fakeImage),
					videos = [],
					sourceList = videoNode.getElementsByTag('source', '');

				if (sourceList.count()==0) {
					sourceList = videoNode.getElementsByTag('source', 'cke');
				}

				for(var i = 0, length = sourceList.count() ; i < length ; i++) {
					var item = sourceList.getItem(i);
					videos.push({src: item.getAttribute('src'), type: item.getAttribute('type')});
				}

				this.videoNode = videoNode;
				this.setupContent(videoNode, videos);
			}
			else {
				this.setupContent(null, []);
			}
		},
		onOk: function() {
			// If there's no selected element create one. Otherwise, reuse it
			var videoNode = null;
			if (!this.fakeImage) {
				videoNode = CKEDITOR.dom.element.createFromHtml('<cke:video></cke:video>', editor.document);
				videoNode.setAttributes({
					controls: 'controls'
				});
			}
			else {
				videoNode = this.videoNode;
			}

			var extraStyles = {}, videos = [];
			this.commitContent(videoNode, extraStyles, videos);

			var innerHtml = '', links = '',
				link = editor.lang.video.linkTemplate || '',
				fallbackTemplate = editor.lang.video.fallbackTemplate || '';

			for (var i = 0; i<videos.length; i++) {
				var video = videos[i];
				if (!video || !video.src) {
					continue;
				}
				innerHtml += '<cke:source src="' + video.src + '" type="' + video.type + '" />';
				links += link.replace('%src%', video.src).replace('%type%', video.type);
			}
			videoNode.setHtml(innerHtml + fallbackTemplate.replace('%links%', links));

			// Refresh the fake image.
			var newFakeImage = editor.createFakeElement(videoNode, 'cke_video', 'video', false);
			newFakeImage.setStyles(extraStyles);
			if (this.fakeImage)	{
				newFakeImage.replace(this.fakeImage);
				editor.getSelection().selectElement(newFakeImage);
			}
			else {
				// Insert it in a div
				var div = new CKEDITOR.dom.element('DIV', editor.document);
				editor.insertElement(div);
				div.append(newFakeImage);
			}
		},
		onHide: function() {
			if (this.previewImage) {
				//this.previewImage.removeListener('load', onImgLoadEvent);
				//this.previewImage.removeListener('error', onImgLoadErrorEvent);
				//this.previewImage.removeListener('abort', onImgLoadErrorEvent);
				this.previewImage.remove();
				this.previewImage = null; // Dialog is closed.
			}
		},
		contents: [
			{
				id: 'info',
				label: editor.lang.video.infoLabel,
				elements: [
					{
						type: 'hbox',
						widths: ['', '100px', '75px'],
						children: [
							{
								type: 'text',
								id: 'src0',
								label: editor.lang.common.url,
								required: true,
								commit: commitSrc,
								setup: loadSrc
							},
							{
								type: 'button',
								id: 'browse',
								hidden: 'true',
								style: 'display:inline-block;margin-top:14px;',
								filebrowser: 'info:src0',
								label: editor.lang.common.browseServer
							},
							{
								id: 'type0',
								label: editor.lang.video.sourceType,
								type: 'select',
								'default': 'video/mp4',
								items: [
									[ 'MP4', 'video/mp4' ],
									[ 'Ogg', 'video/ogg' ],
									[ 'WebM', 'video/webm' ]
								],
								commit: commitSrc,
								setup: loadSrc
							}
						]
					},
					{
						type: 'hbox',
						widths: [ '33%', '33%', '33%'],
						children: [
							{
								type: 'text',
								id: 'width',
								label: editor.lang.common.width,
								'default': editor.config.videoDefaultWidth || 400,
								validate: CKEDITOR.dialog.validate.notEmpty(editor.lang.video.widthRequired),
								commit: commitValue,
								setup: loadValue
							},
							{
								type: 'text',
								id: 'height',
								label: editor.lang.common.height,
								'default': editor.config.videoDefaultHeight || 300,
								validate: CKEDITOR.dialog.validate.notEmpty(editor.lang.video.heightRequired),
								commit: commitValue,
								setup: loadValue
							}
						]
					}
				]
			},
			{
				id: 'Upload',
				hidden: true,
				filebrowser: 'uploadButton',
				label: editor.lang.video.upload,
				elements: [
					{
						type: 'file',
						id: 'upload',
						label: editor.lang.video.btnUpload,
						style: 'height:40px',
						size: 38
					},
					{
						type: 'fileButton',
						id: 'uploadButton',
						filebrowser: 'info:src0',
						label: editor.lang.video.btnUpload,
						'for': [ 'Upload', 'upload' ]
					}
				]
			},
			{
				id: 'advanced',
				label: editor.lang.video.advanced,
				elements: [
					{
						type: 'hbox',
						widths: [ '', '100px'],
						children: [
							{
								type: 'text',
								id: 'poster',
								label: editor.lang.video.poster,
								commit: commitValue,
								setup: loadValue,
								onChange: function() {
									var dialog = this.getDialog(),
										newUrl = this.getValue();

									//Update preview image
									if (newUrl.length > 0) {	//Prevent from load before onShow
										dialog = this.getDialog();
										var preview = dialog.previewImage;
										//preview.on('load', onImgLoadEvent, dialog);
										//preview.on('error', onImgLoadErrorEvent, dialog);
										//preview.on('abort', onImgLoadErrorEvent, dialog);
										preview.setAttribute('src', newUrl);
									}
								}
							},
							{
								type: 'button',
								id: 'browse',
								hidden: 'true',
								style: 'display:inline-block;margin-top:14px;',
								filebrowser: {
									action: 'Browse',
									target: 'advanced:poster',
									url: editor.config.filebrowserImageBrowseUrl || editor.config.filebrowserBrowseUrl
								},
								label: editor.lang.common.browseServer
							}
						]
					}
					// {
					// 	type: 'hbox',
					// 	children: [
					// 		{
					// 			type: 'radio',
					// 			id: 'autoplay',
					// 			label: editor.lang.video.autoplay,
					// 			items: [
					// 				[editor.lang.video.yes, 'yes'],
					// 				[editor.lang.video.no, 'no']
					// 			],
					// 			'default': 'no',
					// 			setup: function(widget) {
					// 				if (widget.data.autoplay) {
					// 					this.setValue(widget.data.autoplay);
					// 				}
					// 			},
					// 			commit: function( widget ) {
					// 				widget.setData('autoplay', this.getValue());
					// 			}
					// 		}
					// 	]
					// }
				]
			}
		]
	};
});