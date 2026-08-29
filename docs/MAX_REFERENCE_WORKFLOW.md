# Max reference workflow

Use this process whenever an object, message, attribute, or connection contract is not certain.

1. Record the exact object name, including `~`, namespace, and likely version constraints.
2. Locate Max. Run `npm run max:help -- OBJECT_NAME`; set `MAX_HOME` if Max is installed outside a standard macOS location.
3. Open the exact `.maxhelp` candidate and inspect object-box text, attributes, inlet/outlet counts and types, and dependency notes.
4. Inspect nearby examples and tutorials returned by the search. Search the Max `Resources/C74` tree when filenames alone do not expose a usage.
5. Compare actual connections and messages in existing patches. Treat examples as evidence, not as text to copy blindly.
6. Confirm that the behavior belongs to the installed Max 9 release. Identify whether each nonstandard object is an external and document its package/version.
7. Only if local resources leave a question unresolved, consult the current official Cycling '74 documentation. State any remaining assumption in the patch or project docs.

The search tool reports filename/path relevance; it does not prove that an attribute or message is valid. Verify relevant content before implementation. Never hard-code a developer's Max installation path into project source.
