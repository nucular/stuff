function Replayer(midiFile, channels) {
	var trackStates = [];
	var beatsPerMinute = 120;
	var ticksPerBeat = midiFile.header.ticksPerBeat;
	var channelCount = channels.length;

	for (var i = 0; i < midiFile.tracks.length; i++) {
		trackStates[i] = {
			'nextEventIndex': 0,
			'ticksToNextEvent': (
				midiFile.tracks[i].length ?
					midiFile.tracks[i][0].deltaTime :
					null
			)
		};
	}

  var secondsToNextEvent;
	var nextEventInfo;

	function getNextEvent() {
		var ticksToNextEvent = null;
		var nextEventTrack = null;
		var nextEventIndex = null;

		for (var i = 0; i < trackStates.length; i++) {
			if (
				trackStates[i].ticksToNextEvent != null
				&& (ticksToNextEvent == null || trackStates[i].ticksToNextEvent < ticksToNextEvent)
			) {
				ticksToNextEvent = trackStates[i].ticksToNextEvent;
				nextEventTrack = i;
				nextEventIndex = trackStates[i].nextEventIndex;
			}
		}
		if (nextEventTrack != null) {
			/* consume event from that track */
			var nextEvent = midiFile.tracks[nextEventTrack][nextEventIndex];
			if (midiFile.tracks[nextEventTrack][nextEventIndex + 1]) {
				trackStates[nextEventTrack].ticksToNextEvent += midiFile.tracks[nextEventTrack][nextEventIndex + 1].deltaTime;
			} else {
				trackStates[nextEventTrack].ticksToNextEvent = null;
			}
			trackStates[nextEventTrack].nextEventIndex += 1;
			/* advance timings on all tracks by ticksToNextEvent */
			for (var i = 0; i < trackStates.length; i++) {
				if (trackStates[i].ticksToNextEvent != null) {
					trackStates[i].ticksToNextEvent -= ticksToNextEvent
				}
			}
			nextEventInfo = {
				'ticksToEvent': ticksToNextEvent,
				'event': nextEvent,
				'track': nextEventTrack
			}
      var beatsToNextEvent = ticksToNextEvent / ticksPerBeat;
			secondsToNextEvent = beatsToNextEvent / (beatsPerMinute / 60);
		} else {
			nextEventInfo = null;
			self.finished = true;
		}
	}

	getNextEvent();

	function handleEvent() {
		var event = nextEventInfo.event;
    if (event == null) return;
		switch (event.type) {
			case 'meta':
				switch (event.subtype) {
					case 'setTempo':
						beatsPerMinute = 60000000 / event.microsecondsPerBeat
				}
				break;
			case 'channel':
				switch (event.subtype) {
					case 'noteOn':
						channels[event.channel].noteOn(event.noteNumber, event.velocity);
						break;
					case 'noteOff':
						channels[event.channel].noteOff(event.noteNumber, event.velocity);
						break;
					case 'programChange':
						//console.log('program change to ' + event.programNumber);
						channels[event.channel].setProgram(event.programNumber);
						break;
				}
				break;
		}
	}

	function replay(seconds) {
    var secondsRemaining = seconds;

		while (true) {
			if (secondsToNextEvent != null && secondsToNextEvent <= secondsRemaining) {
				if (secondsToNextEvent > 0) {
					secondsRemaining -= secondsToNextEvent;
          secondsToNextEvent -= secondsRemaining;
				}

				handleEvent();
				getNextEvent();
			} else {
				/* generate samples to end of buffer */
				if (secondsRemaining > 0) {
					secondsToNextEvent -= secondsRemaining;
				}
				break;
			}
		}
	}

	var self = {
		'replay': replay,
		'finished': false
	}
	return self;
}
