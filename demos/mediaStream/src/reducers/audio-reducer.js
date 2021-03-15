const setAudio = (state = true, action) => (action.type === 'SET_AUDIO' ? action.audio : state);
export default setAudio;
