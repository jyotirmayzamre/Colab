import { WidgetType } from "@uiw/react-codemirror";


class CursorWidget extends WidgetType {
    constructor(
        readonly colour: string,
        readonly username: string
    ) { super() }

    eq(other: CursorWidget): boolean{
        return (other.colour == this.colour) && (other.username == this.username)
    }

    toDOM(): HTMLSpanElement{
        const container = document.createElement('span');
        container.style.position = "relative";
        container.style.display = "inline-block";
        container.style.pointerEvents = "none";
        container.style.verticalAlign = 'top';
        
        //cursor line
        const cursor = document.createElement('span');
        cursor.style.borderLeft = `2px solid ${this.colour}`;
        cursor.style.marginLeft = "-1px";
        cursor.style.height = "1.2em";
        cursor.style.display = "inline-block";
        cursor.style.pointerEvents = "none";
        
        //username label
        const label = document.createElement('span');
        label.textContent = this.username; 
        label.style.position = "absolute";
        label.style.bottom = "100%"; 
        label.style.left = "50%";
        label.style.backgroundColor = this.colour;
        label.style.color = "white";
        label.style.padding = "2px 6px";
        label.style.borderRadius = "4px 4px 4px 0"; 
        label.style.fontSize = "11px";
        label.style.fontWeight = "500";
        label.style.whiteSpace = "nowrap";
        label.style.transform = "translateX(-50%)"; 
        label.style.marginBottom = "2px"; 
        label.style.zIndex = "1000";
        
        container.appendChild(label);
        container.appendChild(cursor);
        
        return container;
    }

    ignoreEvent(): boolean {
        return true;
    }
}

export default CursorWidget;