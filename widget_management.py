def clear_layout(layout):
    if layout is not None:
        while layout.count():
            item = layout.takeAt(0)
            widget = item.widget()
            if item is not None:
                layout.removeWidget(widget)
                widget.setParent(None)
            else:  # Other sources use: elif item.layout() is not None:
                clear_layout(item.layout())


def delete_layout(parent_layout, child_layout):
    for i in range(parent_layout.count()):
        item = parent_layout.itemAt(i)
        if item.layout() == child_layout:
            clear_layout(child_layout.layout())
            parent_layout.removeItem(child_layout)
            break
