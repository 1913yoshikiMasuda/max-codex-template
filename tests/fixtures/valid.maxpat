{
  "patcher": {
    "boxes": [
      { "box": { "id": "source", "maxclass": "newobj", "text": "cycle~ 440", "varname": "source", "patching_rect": [20, 20, 80, 20] } },
      { "box": { "id": "sink", "maxclass": "ezdac~", "varname": "sink", "patching_rect": [20, 100, 40, 40] } },
      { "box": { "id": "sub", "maxclass": "newobj", "text": "p detail", "patching_rect": [180, 20, 60, 20], "patcher": {
        "boxes": [{ "box": { "id": "inside", "maxclass": "comment", "text": "inside", "patching_rect": [20, 20, 60, 20] } }],
        "lines": []
      } } },
      { "box": { "id": "monitor", "maxclass": "bpatcher", "name": "n4m.monitor.maxpat", "patching_rect": [180, 100, 120, 80] } }
    ],
    "lines": [
      { "patchline": { "source": ["source", 0], "destination": ["sink", 0] } },
      { "patchline": { "source": ["source", 0], "destination": ["sink", 1] } }
    ]
  }
}
