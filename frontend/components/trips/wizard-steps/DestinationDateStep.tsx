"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarDays,
  MapPin,
  Users,
  Plus,
  Loader2,
  Trash2,
} from "lucide-react";
import { Destination } from "@/types/travel";
import { useGooglePlacesNew } from "@/hooks/use-google-places-new";
import { useDebounce } from "@/hooks/use-debounce";

interface DestinationDateStepProps {
  formData: any;
  updateFormData: (updates: any) => void;
  errors?: Record<string, string>;
}

export function DestinationDateStep({
  formData,
  updateFormData,
  errors = {},
}: DestinationDateStepProps) {
  const [isMultiDestination, setIsMultiDestination] = useState(
    formData.destinations.length > 0
  );
  const [activeDestinationIndex, setActiveDestinationIndex] = useState(0);

  // For single destination mode
  const [destinationSearch, setDestinationSearch] = useState(
    formData.destination
      ? `${formData.destination.name}, ${formData.destination.country}`
      : ""
  );

  // For multi-destination mode
  const [multiDestinationSearches, setMultiDestinationSearches] = useState<
    string[]
  >(
    formData.destinations.map((d: any) =>
      d.destination ? `${d.destination.name}, ${d.destination.country}` : ""
    )
  );

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Destination[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { searchDestinations } = useGooglePlacesNew();
  const debouncedSearch = useDebounce(
    isMultiDestination
      ? multiDestinationSearches[activeDestinationIndex] || ""
      : destinationSearch,
    300
  );

  // Search for destinations when input changes
  useEffect(() => {
    if (debouncedSearch && debouncedSearch.length > 2) {
      setIsSearching(true);
      searchDestinations(debouncedSearch)
        .then((results) => {
          setSuggestions(results);
          setIsSearching(false);
        })
        .catch((err) => {
          console.error("Search error:", err);
          setIsSearching(false);
        });
    } else {
      setSuggestions([]);
    }
  }, [debouncedSearch, searchDestinations]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Auto-calculate overall trip dates based on destinations
  useEffect(() => {
    if (isMultiDestination && formData.destinations.length > 0) {
      const firstArrival = formData.destinations[0]?.arrivalDate;
      const lastDeparture =
        formData.destinations[formData.destinations.length - 1]?.departureDate;

      if (firstArrival && lastDeparture) {
        updateFormData({
          startDate: new Date(firstArrival),
          endDate: new Date(lastDeparture),
        });
      }
    }
  }, [formData.destinations, isMultiDestination]);

  const toggleMultiDestination = () => {
    if (!isMultiDestination) {
      // Convert single destination to multi-destination format
      if (formData.destination) {
        updateFormData({
          destinations: [
            {
              destination: formData.destination,
              arrivalDate: formData.startDate,
              departureDate: formData.endDate,
              order: 0,
            },
          ],
          destination: null,
        });
        setMultiDestinationSearches([
          `${formData.destination.name}, ${formData.destination.country}`,
        ]);
      } else {
        // Start with empty first destination
        updateFormData({
          destinations: [
            {
              destination: null,
              arrivalDate: formData.startDate,
              departureDate: formData.endDate,
              order: 0,
            },
          ],
        });
        setMultiDestinationSearches([""]);
      }
    } else {
      // Convert back to single destination
      if (
        formData.destinations.length > 0 &&
        formData.destinations[0].destination
      ) {
        updateFormData({
          destination: formData.destinations[0].destination,
          destinations: [],
          startDate: formData.destinations[0].arrivalDate,
          endDate:
            formData.destinations[formData.destinations.length - 1]
              ?.departureDate || formData.destinations[0].departureDate,
        });
        setDestinationSearch(
          formData.destinations[0].destination
            ? `${formData.destinations[0].destination.name}, ${formData.destinations[0].destination.country}`
            : ""
        );
      }
      setMultiDestinationSearches([]);
    }
    setIsMultiDestination(!isMultiDestination);
  };

  const selectDestination = (destination: Destination) => {
    if (isMultiDestination) {
      const updatedDestinations = [...formData.destinations];
      updatedDestinations[activeDestinationIndex] = {
        ...updatedDestinations[activeDestinationIndex],
        destination,
      };
      updateFormData({ destinations: updatedDestinations });

      const updatedSearches = [...multiDestinationSearches];
      updatedSearches[
        activeDestinationIndex
      ] = `${destination.name}, ${destination.country}`;
      setMultiDestinationSearches(updatedSearches);
    } else {
      updateFormData({ destination });
      setDestinationSearch(`${destination.name}, ${destination.country}`);
    }
    setShowSuggestions(false);
  };

  const addDestination = () => {
    const lastDestination =
      formData.destinations[formData.destinations.length - 1];
    const newDestination = {
      destination: null,
      arrivalDate: lastDestination?.departureDate || null,
      departureDate: null,
      order: formData.destinations.length,
    };

    updateFormData({
      destinations: [...formData.destinations, newDestination],
    });
    setMultiDestinationSearches([...multiDestinationSearches, ""]);
    setActiveDestinationIndex(formData.destinations.length);
  };

  const removeDestination = (index: number) => {
    if (formData.destinations.length > 1) {
      const updatedDestinations = formData.destinations.filter(
        (_: any, i: number) => i !== index
      );
      // Reorder remaining destinations
      updatedDestinations.forEach((dest: any, i: number) => {
        dest.order = i;
      });

      updateFormData({ destinations: updatedDestinations });

      const updatedSearches = multiDestinationSearches.filter(
        (_, i) => i !== index
      );
      setMultiDestinationSearches(updatedSearches);

      if (activeDestinationIndex >= updatedDestinations.length) {
        setActiveDestinationIndex(Math.max(0, updatedDestinations.length - 1));
      }
    }
  };

  const updateDestinationDates = (
    index: number,
    field: "arrivalDate" | "departureDate",
    value: Date | null
  ) => {
    const updatedDestinations = [...formData.destinations];
    updatedDestinations[index] = {
      ...updatedDestinations[index],
      [field]: value,
    };

    // Auto-adjust next destination's arrival date
    if (
      field === "departureDate" &&
      value &&
      index < updatedDestinations.length - 1
    ) {
      const nextDestination = updatedDestinations[index + 1];
      if (!nextDestination.arrivalDate || nextDestination.arrivalDate < value) {
        nextDestination.arrivalDate = value;
      }
    }

    updateFormData({ destinations: updatedDestinations });
  };

  const updateTraveler = (index: number, field: string, value: any) => {
    const updatedTravelers = [...formData.travelers];
    updatedTravelers[index] = { ...updatedTravelers[index], [field]: value };
    updateFormData({ travelers: updatedTravelers });
  };

  const addTraveler = () => {
    const newTraveler = {
      name: "",
      relationship: "friend" as const,
      age: undefined,
    };
    updateFormData({ travelers: [...formData.travelers, newTraveler] });
  };

  const removeTraveler = (index: number) => {
    if (formData.travelers.length > 1) {
      const updatedTravelers = formData.travelers.filter(
        (_: any, i: number) => i !== index
      );
      updateFormData({ travelers: updatedTravelers });
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  const parseDate = (dateString: string) => {
    return dateString ? new Date(dateString) : null;
  };

  return (
    <div className="space-y-6">
      {/* Destination Section */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold">Destination</h3>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleMultiDestination}
              className="text-xs"
            >
              {isMultiDestination ? "← Single" : "Multi-stop →"}
            </Button>
          </div>

          {!isMultiDestination ? (
            // Single destination mode
            <div className="relative" ref={dropdownRef}>
              <Input
                placeholder="Search cities, countries, or landmarks..."
                value={destinationSearch}
                onChange={(e) => {
                  setDestinationSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className={`h-12 ${
                  errors.destination ? "border-destructive" : ""
                }`}
              />

              {showSuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">
                        Searching...
                      </p>
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <p className="text-sm">No destinations found</p>
                    </div>
                  ) : (
                    suggestions.map((destination) => (
                      <button
                        key={destination.id}
                        className="w-full px-4 py-2.5 text-left hover:bg-muted/50 border-b last:border-b-0 transition-colors"
                        onClick={() => selectDestination(destination)}
                      >
                        <div className="flex items-center gap-3">
                          {destination.imageUrl && (
                            <img
                              src={destination.imageUrl}
                              alt={destination.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium">
                              {destination.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {destination.country}
                            </div>
                            {destination.description && (
                              <div className="text-xs text-gray-400">
                                {destination.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            // Multi-destination mode
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Build your multi-stop journey
              </p>

              <div className="space-y-4">
                {formData.destinations.map((dest: any, index: number) => (
                  <div key={index} className="relative">
                    <div className="flex gap-3">
                      {/* Step Indicator */}
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        {index < formData.destinations.length - 1 && (
                          <div className="w-0.5 flex-1 bg-border mt-2" />
                        )}
                      </div>

                      {/* Destination Content */}
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-medium">
                            Stop {index + 1}
                          </Label>
                          {formData.destinations.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 -mr-2"
                              onClick={() => removeDestination(index)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>

                        <div
                          className="relative"
                          ref={
                            activeDestinationIndex === index
                              ? dropdownRef
                              : undefined
                          }
                        >
                          <Input
                            placeholder="Search cities, countries, or landmarks..."
                            value={multiDestinationSearches[index] || ""}
                            onChange={(e) => {
                              const updatedSearches = [
                                ...multiDestinationSearches,
                              ];
                              updatedSearches[index] = e.target.value;
                              setMultiDestinationSearches(updatedSearches);
                              setActiveDestinationIndex(index);
                              setShowSuggestions(true);
                            }}
                            onFocus={() => {
                              setActiveDestinationIndex(index);
                              setShowSuggestions(true);
                            }}
                            className="h-10"
                          />

                          {showSuggestions &&
                            activeDestinationIndex === index && (
                              <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {isSearching ? (
                                  <div className="p-3 text-center">
                                    <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Searching...
                                    </p>
                                  </div>
                                ) : suggestions.length === 0 ? (
                                  <div className="p-3 text-center text-muted-foreground">
                                    <p className="text-xs">
                                      No destinations found
                                    </p>
                                  </div>
                                ) : (
                                  suggestions.map((destination) => (
                                    <button
                                      key={destination.id}
                                      className="w-full px-3 py-2 text-left hover:bg-muted/50 border-b last:border-b-0 transition-colors"
                                      onClick={() =>
                                        selectDestination(destination)
                                      }
                                    >
                                      <div className="flex items-center gap-2">
                                        {destination.imageUrl && (
                                          <img
                                            src={destination.imageUrl}
                                            alt={destination.name}
                                            className="w-8 h-8 rounded object-cover"
                                          />
                                        )}
                                        <div className="flex-1 text-left">
                                          <div className="text-sm font-medium">
                                            {destination.name}
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            {destination.country}
                                          </div>
                                        </div>
                                      </div>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                        </div>

                        {dest.destination && (
                          <div className="mt-2 p-2 bg-muted/50 rounded flex items-center gap-2">
                            {dest.destination.imageUrl && (
                              <img
                                src={dest.destination.imageUrl}
                                alt={dest.destination.name}
                                className="w-8 h-8 rounded object-cover"
                              />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {dest.destination.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {dest.destination.country}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Arrival
                            </Label>
                            <Input
                              type="date"
                              value={formatDate(dest.arrivalDate)}
                              onChange={(e) =>
                                updateDestinationDates(
                                  index,
                                  "arrivalDate",
                                  parseDate(e.target.value)
                                )
                              }
                              min={
                                index > 0
                                  ? formatDate(
                                      formData.destinations[index - 1]
                                        ?.departureDate
                                    )
                                  : new Date().toISOString().split("T")[0]
                              }
                              className="mt-1 h-9 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Departure
                            </Label>
                            <Input
                              type="date"
                              value={formatDate(dest.departureDate)}
                              onChange={(e) =>
                                updateDestinationDates(
                                  index,
                                  "departureDate",
                                  parseDate(e.target.value)
                                )
                              }
                              min={
                                dest.arrivalDate
                                  ? formatDate(dest.arrivalDate)
                                  : undefined
                              }
                              className="mt-1 h-9 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addDestination}
                className="w-full h-10"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Another Stop
              </Button>

              {(errors.destination || errors.destinations) && (
                <p className="text-sm text-red-500">
                  {errors.destination || errors.destinations}
                </p>
              )}
            </div>
          )}

          {/* Display selected destination */}
          {!isMultiDestination && formData.destination && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                {formData.destination.imageUrl && (
                  <img
                    src={formData.destination.imageUrl}
                    alt={formData.destination.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium">{formData.destination.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.destination.country}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dates Section - Single Destination */}
      {!isMultiDestination && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CalendarDays className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold">Travel Dates</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="startDate"
                  className="text-sm font-normal text-muted-foreground"
                >
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formatDate(formData.startDate)}
                  onChange={(e) =>
                    updateFormData({ startDate: parseDate(e.target.value) })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  className={`mt-1.5 ${
                    errors.startDate ? "border-destructive" : ""
                  }`}
                />
                {errors.startDate && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.startDate}
                  </p>
                )}
              </div>
              <div>
                <Label
                  htmlFor="endDate"
                  className="text-sm font-normal text-muted-foreground"
                >
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formatDate(formData.endDate)}
                  onChange={(e) =>
                    updateFormData({ endDate: parseDate(e.target.value) })
                  }
                  min={
                    formData.startDate
                      ? formatDate(formData.startDate)
                      : new Date().toISOString().split("T")[0]
                  }
                  className={`mt-1.5 ${
                    errors.endDate ? "border-destructive" : ""
                  }`}
                />
                {errors.endDate && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.endDate}
                  </p>
                )}
              </div>
            </div>

            {formData.startDate && formData.endDate && (
              <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">
                  Duration:{" "}
                </span>
                <span className="text-sm font-medium">
                  {Math.ceil(
                    (formData.endDate.getTime() -
                      formData.startDate.getTime()) /
                      (1000 * 60 * 60 * 24)
                  ) + 1}{" "}
                  days
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Overall trip duration for multi-destination */}
      {isMultiDestination && formData.startDate && formData.endDate && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CalendarDays className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">Total Duration</span>
              </div>
              <span className="text-sm font-semibold bg-muted px-3 py-1 rounded-full">
                {Math.ceil(
                  (formData.endDate.getTime() - formData.startDate.getTime()) /
                    (1000 * 60 * 60 * 24)
                ) + 1}{" "}
                days
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Travelers Section */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold">Travelers</h3>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addTraveler}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>

          <div className="space-y-3">
            {formData.travelers.map((traveler: any, index: number) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-5">
                  <Label className="text-sm font-normal text-muted-foreground">
                    Name
                  </Label>
                  <Input
                    placeholder="Full name"
                    value={traveler.name}
                    onChange={(e) =>
                      updateTraveler(index, "name", e.target.value)
                    }
                    className="mt-1.5 h-10"
                  />
                </div>
                <div className="col-span-4">
                  <Label className="text-sm font-normal text-muted-foreground">
                    Relationship
                  </Label>
                  <select
                    className="w-full h-10 px-3 mt-1.5 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={traveler.relationship}
                    onChange={(e) =>
                      updateTraveler(index, "relationship", e.target.value)
                    }
                  >
                    <option value="self">Self</option>
                    <option value="partner">Partner</option>
                    <option value="family">Family</option>
                    <option value="friend">Friend</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-normal text-muted-foreground">
                    Age
                  </Label>
                  <Input
                    type="number"
                    placeholder="-"
                    value={traveler.age || ""}
                    onChange={(e) =>
                      updateTraveler(
                        index,
                        "age",
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    className="mt-1.5 h-10"
                  />
                </div>
                <div className="col-span-1">
                  {formData.travelers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTraveler(index)}
                      className="h-10 w-10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {errors.travelers && (
            <p className="text-xs text-destructive mt-1">{errors.travelers}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
