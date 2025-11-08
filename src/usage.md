# Function Library Usage Guide

## 📁 File Structure

```
src/
├── lib/
│   └── functions.ts          ← CREATE THIS (all your functions)
└── components/
    └── altair/
        └── Altair.tsx         ← MODIFY THIS (import and use)
```

---

## 📦 Step 1: Import Block

Add this at the top of your `Altair.tsx`:

```typescript
import { 
  allFunctionDeclarations,
  handleFunctionCall 
} from "../../lib/functions";
```

**What this imports:**
- `allFunctionDeclarations` - Array of all function declarations
- `handleFunctionCall` - Router that calls the right handler

---

## 🔧 Step 2: Usage Block (in setConfig)

```typescript
tools: [
  { googleSearch: {} },
  { 
    functionDeclarations: [
      renderAltairDeclaration,      // Your graph function
      ...allFunctionDeclarations,   // All imported functions
    ] 
  },
],
```

**The `...` spreads all functions into the array**

---

## 🎯 Step 3: Usage Block (in onToolCall)

```typescript
const onToolCall = async (toolCall: LiveServerToolCall) => {
  if (!toolCall.functionCalls) return;

  const responses = await Promise.all(
    toolCall.functionCalls.map(async (fc) => {
      let result: any;

      // Handle your custom functions first
      if (fc.name === "render_altair") {
        const str = (fc.args as any).json_graph;
        setJSONString(str);
        result = { success: true };
      }
      // Let the library handle everything else
      else {
        result = await handleFunctionCall(fc.name, fc.args);
        
        // Optionally store results for display
        if (result && fc.name === "get_weather") {
          setWeatherData(result);
        }
      }

      return {
        response: { output: result },
        id: fc.id,
        name: fc.name,
      };
    })
  );

  // Send responses back to AI
  if (responses.length) {
    setTimeout(() => {
      client.sendToolResponse({ functionResponses: responses });
    }, 200);
  }
};
```

---

## 🧪 Test Examples

Once set up, try these commands:

| Say This | AI Calls | Result |
|----------|----------|--------|
| "What's the weather in Nairobi?" | `get_weather` | Shows weather card |
| "Calculate 25 times 4" | `calculate` | Returns 100 |
| "Save a note titled 'Meeting' with content 'Discuss budget'" | `save_note` | Saves to sessionStorage |
| "Set a timer for 5 minutes" | `set_timer` | Sets countdown |
| "Help me choose between pizza and burger" | `make_decision` | Picks one randomly |
| "Open YouTube" | `open_url` | Opens youtube.com |
| "Notify me about the update" | `send_notification` | Browser notification |
| "Show me a graph of sales" | `render_altair` | Renders chart |

---

## ➕ Adding New Functions

### In `functions.ts`:

1. **Add declaration:**
```typescript
export const myNewDeclaration: FunctionDeclaration = {
  name: "my_function",
  description: "What it does",
  parameters: { /* ... */ }
};
```

2. **Add handler:**
```typescript
export const handleMyFunction = (args: any) => {
  // Your logic
  return { success: true, data: "result" };
};
```

3. **Add to router:**
```typescript
export const handleFunctionCall = async (functionName: string, args: any) => {
  switch (functionName) {
    // ... existing cases
    case "my_function":
      return handleMyFunction(args);
    // ...
  }
};
```

4. **Add to array:**
```typescript
export const allFunctionDeclarations = [
  // ... existing
  myNewDeclaration,
];
```

### That's it! No changes needed in Altair.tsx ✅

---

## 🎉 Benefits

✅ **Clean separation** - Functions in one file  
✅ **Easy to add** - Just edit functions.ts  
✅ **Reusable** - Import in multiple components  
✅ **Maintainable** - All logic in one place  
✅ **Simple Altair.tsx** - Just import and use  

---

## 📝 Summary

1. Create `src/lib/functions.ts` with all functions
2. Import in `Altair.tsx`: `import { allFunctionDeclarations, handleFunctionCall } from "../../lib/functions"`
3. Add to config: `...allFunctionDeclarations`
4. Route calls: `result = await handleFunctionCall(fc.name, fc.args)`
5. Done! 🚀