
export default function ajaxGet(url, callback) {
    var req = new XMLHttpRequest();
	req.open("GET", url);
	req.overrideMimeType("text/plain; charset=x-user-defined");
	req.onerror = () => console.log(`Error loading ${url}: ${req.statusText}`);
	req.onload = function() {
		if (this.status === 200) {
            callback(this.responseText)
		} else if (this.status === 0) {
			// Aborted, so ignore error
		} else {
			req.onerror();
		}
	};
	req.send();
}