import { ViewUpdate, ViewPlugin, DecorationSet, Decoration } from "@uiw/react-codemirror";
import CursorWidget from "./CursorWidget";

export interface RemoteCursor {
    pos: number
    colour: string
    username: string
}


export function remoteCursorPlugin(
    getCursors: () => RemoteCursor[]
) {
    return ViewPlugin.fromClass(class {
        decorations: DecorationSet

        constructor(){
            this.decorations = this.build();
        }

        update(update: ViewUpdate) {
            if (update.docChanged || update.viewportChanged) {
                this.decorations = this.build()
            }
        }

        build() {
            const widgets = getCursors().map(c =>
            Decoration.widget({
                widget: new CursorWidget(c.colour, c.username),
                side: 1,
                block: false
            }).range(c.pos)
            )

            return Decoration.set(widgets, true)
        }
        }, {
            decorations: v => v.decorations
        }) 
}