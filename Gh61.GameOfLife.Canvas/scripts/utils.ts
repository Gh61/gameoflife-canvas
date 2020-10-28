namespace kox {
	/**
	 * standard observable with parsing to int.
	 * @param value
	 */
	export function intObservable(value?: number): ko.Subscribable<number> {
		var backingObservable = value ? ko.observable(value) : ko.observable<number>();

		return ko.computed({
			write: value => { backingObservable(parseInt(<any>value)); },
			read: () => { return backingObservable(); }
		});
	}
}