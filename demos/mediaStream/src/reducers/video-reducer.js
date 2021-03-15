const setVideo = (state = true, action) => (action.type === 'SET_VIDEO' ? action.video : state);
export default setVideo;
